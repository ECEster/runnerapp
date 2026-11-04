// Stuurt herinneringen per e-mail voor opgeslagen runs (Mijn Runs).
//
// Per gebruiker met herinneringen aan (tabel reminder_settings):
//   - een run uit de favorieten die binnen 'days_before' dagen plaatsvindt
//   - (optioneel) een run waarvan de inschrijfdeadline binnen 3 dagen valt
// Alles voor één gebruiker gaat in één e-mail. Wat verstuurd is, komt in
// reminder_log, zodat niemand dezelfde herinnering twee keer krijgt (ook niet
// als de workflow een dag overslaat: dan gaat hij de volgende dag alsnog).
//
// Vereist migratie 0012_reminders.sql, en voor --live: nodemailer
// (npm install nodemailer) + GMAIL_SENDER_ADDRESS en GMAIL_APP_PASSWORD.
//
// Draaien:  node send-reminders.js          (dry-run: toont wie wat zou krijgen)
//           node send-reminders.js --live   (verstuurt)

try {
  process.loadEnvFile()
} catch {
  // geen .env
}

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const SITE = (process.env.SITE_URL || 'https://nl-running.netlify.app').replace(/\/$/, '')
const isLive = process.argv.includes('--live')
const DEADLINE_DAYS = 3

async function get(path) {
  const res = await fetch(`${URL_BASE}${path}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} — ${await res.text()}`)
  return res.json()
}

// Datum van vandaag in Nederland (de workflow draait in UTC)
function todayNL() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date())
}

function daysBetween(fromIso, toIso) {
  return Math.round((Date.parse(toIso + 'T12:00:00Z') - Date.parse(fromIso + 'T12:00:00Z')) / 86400000)
}

function fmtDate(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}

function inDays(n) {
  return n === 0 ? 'vandaag' : n === 1 ? 'morgen' : `over ${n} dagen`
}

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function buildMail(items) {
  const lines = []
  const html = []
  for (const it of items) {
    const ev = it.ev
    const url = `${SITE}/evenement.html?id=${ev.id}`
    const what = it.kind === 'event'
      ? `${ev.name_nl} in ${ev.city}: ${fmtDate(ev.date)} (${inDays(it.days)})`
      : `Inschrijven voor ${ev.name_nl} kan nog t/m ${fmtDate(ev.registration_deadline)} (${inDays(it.days)})`
    const extra = it.kind === 'event' && ev.sold_out ? ' Let op: uitverkocht.' : ''
    lines.push(`- ${what}.${extra}\n  ${url}`)
    html.push(`<li><a href="${url}">${escapeHtml(ev.name_nl)}</a> ${escapeHtml(what.replace(ev.name_nl, '').trim())}.${escapeHtml(extra)}</li>`)
  }
  const settings = `${SITE}/mijnruns.html#reminders`
  return {
    subject: items.length === 1 && items[0].kind === 'event'
      ? `Herinnering: ${items[0].ev.name_nl} ${inDays(items[0].days)}`
      : 'Herinnering voor je opgeslagen runs',
    text: `Hoi,\n\nEen herinnering voor je opgeslagen runs op RunningNederland:\n\n${lines.join('\n\n')}\n\nVeel loopplezier!\n\nGeen herinneringen meer? Zet ze uit in Mijn Runs: ${settings}\n`,
    html: `<p>Hoi,</p><p>Een herinnering voor je opgeslagen runs op RunningNederland:</p><ul>${html.join('')}</ul><p>Veel loopplezier!</p>` +
      `<p style="font-size:13px;color:#555">Geen herinneringen meer? <a href="${settings}">Zet ze uit in Mijn Runs</a>.</p>`,
  }
}

async function main() {
  if (!URL_BASE || !KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ontbreken (zie .env.example)')
  console.log(isLive ? '=== LIVE ===' : '=== DRY RUN (er wordt niets verstuurd) ===')
  const today = todayNL()

  const settings = await get('/rest/v1/reminder_settings?select=user_id,enabled,days_before,deadline_reminder&or=(enabled.eq.true,deadline_reminder.eq.true)')
  console.log(`${settings.length} gebruiker(s) met herinneringen aan`)
  if (!settings.length) return

  const ids = settings.map((s) => s.user_id)
  const favorites = await get(`/rest/v1/favorites?select=user_id,event_id&user_id=in.(${ids.join(',')})`)
  const eventIds = [...new Set(favorites.map((f) => f.event_id))]
  const events = eventIds.length
    ? await get(`/rest/v1/events?select=id,name_nl,date,city,registration_deadline,sold_out&published=eq.true&id=in.(${eventIds.join(',')})`)
    : []
  const eventById = new Map(events.map((e) => [e.id, e]))
  const sent = await get(`/rest/v1/reminder_log?select=user_id,event_id,kind&user_id=in.(${ids.join(',')})`)
  const already = new Set(sent.map((r) => `${r.user_id}|${r.event_id}|${r.kind}`))

  let transporter = null
  if (isLive) {
    const nodemailer = (await import('nodemailer')).default
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.GMAIL_SENDER_ADDRESS, pass: process.env.GMAIL_APP_PASSWORD },
    })
  }

  let mails = 0
  for (const s of settings) {
    const items = []
    for (const f of favorites.filter((x) => x.user_id === s.user_id)) {
      const ev = eventById.get(f.event_id)
      if (!ev) continue
      const untilRun = daysBetween(today, ev.date)
      if (s.enabled && untilRun >= 0 && untilRun <= s.days_before && !already.has(`${s.user_id}|${ev.id}|event`)) {
        items.push({ kind: 'event', ev, days: untilRun })
      }
      if (s.deadline_reminder && ev.registration_deadline) {
        const untilDeadline = daysBetween(today, ev.registration_deadline)
        if (untilDeadline >= 0 && untilDeadline <= DEADLINE_DAYS && !already.has(`${s.user_id}|${ev.id}|deadline`)) {
          items.push({ kind: 'deadline', ev, days: untilDeadline })
        }
      }
    }
    if (!items.length) continue
    items.sort((a, b) => a.days - b.days)

    const user = await get(`/auth/v1/admin/users/${s.user_id}`)
    if (!user.email) continue
    const mail = buildMail(items)
    console.log(`  ${user.email.replace(/^(.).*(@.*)$/, '$1…$2')}: ${mail.subject} (${items.length} item(s))`)
    if (!isLive) continue

    await transporter.sendMail({
      from: `RunningNederland <${process.env.GMAIL_SENDER_ADDRESS}>`,
      to: user.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    })
    mails++
    const r = await fetch(`${URL_BASE}/rest/v1/reminder_log`, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify(items.map((it) => ({ user_id: s.user_id, event_id: it.ev.id, kind: it.kind }))),
    })
    if (!r.ok) console.warn(`    Kon niet vastleggen in reminder_log: HTTP ${r.status}`)
  }
  console.log(isLive ? `\n${mails} e-mail(s) verstuurd.` : '\n(dry-run: niets verstuurd)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
