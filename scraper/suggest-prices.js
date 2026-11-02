// Zoekt het inschrijfgeld op de organisatorsite (de inschrijflink) van komende
// evenementen zonder prijs, en zet het gevonden bedrag als VOORSTEL klaar in
// price_suggestion — met het zinnetje van de site (price_suggestion_quote) en
// de pagina (price_suggestion_url). Op de site verschijnt er niets: in het
// admin-paneel klik je per voorstel op "Overnemen" (dan wordt het de echte
// prijs) of "Overslaan".
//
// Welke evenementen: komend, prijs leeg / "volgt" / "n.b.", nog geen
// openstaand voorstel, en niet in de afgelopen RECHECK_DAYS dagen al bekeken.
// Een overgeslagen voorstel (price_suggestion_rejected) wordt niet opnieuw
// voorgesteld, tenzij de site inmiddels een ander bedrag noemt.
//
// Vereist migratie 0009_add_price_suggestion.sql.
//
// Draaien:  node suggest-prices.js          (dry-run: toont wat er gevonden wordt)
//           node suggest-prices.js --live   (slaat de voorstellen op)
// Uitvoer:  .cache/prijsvoorstellen.json, en price-suggestions-report.txt als
//           inhoud van de e-mail (leeg als er niets nieuws is)

try {
  process.loadEnvFile()
} catch {
  // geen .env
}

import { mkdirSync, writeFileSync } from 'node:fs'
import { extractPrice, findPriceLinks } from './lib/extractPrice.js'

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const isLive = process.argv.includes('--live')
const RECHECK_DAYS = 14
const REPORT_PATH = 'price-suggestions-report.txt'
const ADMIN_URL = 'https://runningnederland.nl/admin-panel.html'

// Sites zonder eigen prijsinformatie of die automatische bezoekers weigeren
const SKIP_HOSTS = /(hardloopkalendernederland|runphy|loopjeloopje|facebook\.com|instagram\.com|google\.)/i
const NEEDS_PRICE = /^\s*$|volgt|n\.?\s?b\.?|onbekend/i

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (RunningNederland.nl prijscheck)' },
      signal: AbortSignal.timeout(12000),
    })
    if (res.ok && (res.headers.get('content-type') || '').includes('html')) return await res.text()
  } catch {
    // onbereikbaar
  }
  return null
}

// Eerst de inschrijflink zelf, anders een paar links op die site die naar
// inschrijven/tarieven/info wijzen
async function findPrice(url) {
  if (!url || !/^https?:\/\//i.test(url) || SKIP_HOSTS.test(url)) return null
  const html = await fetchPage(url)
  if (!html) return null
  const direct = extractPrice(html)
  if (direct) return { ...direct, url }
  for (const link of findPriceLinks(html, url)) {
    const sub = await fetchPage(link)
    const found = sub && extractPrice(sub)
    if (found) return { ...found, url: link }
  }
  return null
}

async function main() {
  if (!URL_BASE || !KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ontbreken (zie .env.example)')
  const today = new Date().toISOString().slice(0, 10)
  const res = await fetch(
    `${URL_BASE}/rest/v1/events?select=id,name_nl,date,price,registration_url,price_suggestion,price_suggestion_rejected,price_checked_at&date=gte.${today}&order=date`,
    { headers: HEADERS },
  )
  if (!res.ok) throw new Error(`Kon events niet ophalen: HTTP ${res.status} — ${await res.text()} (migratie 0009 al gedraaid?)`)
  const recheckBefore = new Date(Date.now() - RECHECK_DAYS * 86400000).toISOString()
  const events = (await res.json()).filter(
    (ev) =>
      NEEDS_PRICE.test(ev.price || '') &&
      !ev.price_suggestion &&
      (!ev.price_checked_at || ev.price_checked_at < recheckBefore),
  )
  console.log(isLive ? '=== LIVE ===' : '=== DRY RUN (niets wordt opgeslagen) ===')
  console.log(`${events.length} komende events zonder prijs om te bekijken`)

  const results = []
  const queue = [...events]
  let done = 0
  async function worker() {
    while (queue.length) {
      const ev = queue.shift()
      const found = await findPrice(ev.registration_url)
      const rejected = found && found.price === ev.price_suggestion_rejected
      results.push({ ev, found: rejected ? null : found, rejected })
      if (++done % 50 === 0) console.log(`  ${done}/${events.length} bekeken, ${results.filter((r) => r.found).length} gevonden`)
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))

  const found = results.filter((r) => r.found).sort((a, b) => a.ev.date.localeCompare(b.ev.date))
  mkdirSync('.cache', { recursive: true })
  writeFileSync(
    '.cache/prijsvoorstellen.json',
    JSON.stringify(found.map(({ ev, found: f }) => ({ id: ev.id, naam: ev.name_nl, datum: ev.date, prijs: f.price, zin: f.quote, url: f.url })), null, 2),
  )

  console.log(`\n${found.length} prijsvoorstellen gevonden:`)
  for (const { ev, found: f } of found) console.log(`  id ${ev.id} | ${ev.date} | ${ev.name_nl} -> ${f.price}\n      "${f.quote}"`)
  const skipped = results.filter((r) => r.rejected).length
  if (skipped) console.log(`(${skipped} keer hetzelfde bedrag als een eerder overgeslagen voorstel — niet opnieuw voorgesteld)`)

  if (isLive) {
    const now = new Date().toISOString()
    let ok = 0
    let failed = 0
    for (const { ev, found: f } of results) {
      // Ook zonder vondst de controledatum zetten, zodat een volgende run dit event pas na RECHECK_DAYS opnieuw bekijkt
      const fields = f
        ? { price_checked_at: now, price_suggestion: f.price, price_suggestion_quote: f.quote, price_suggestion_url: f.url }
        : { price_checked_at: now }
      const r = await fetch(`${URL_BASE}/rest/v1/events?id=eq.${ev.id}`, { method: 'PATCH', headers: HEADERS, body: JSON.stringify(fields) })
      if (r.ok) ok++
      else failed++
    }
    console.log(`\n${ok} events bijgewerkt (${found.length} met een voorstel), ${failed} mislukt.`)
    if (found.length) console.log('Bekijk de voorstellen in het admin-paneel: filter "Met prijsvoorstel".')
  }

  // Inhoud van de e-mail (zie de workflows): leeg = geen mail. Alleen bij
  // --live, want bij een dry-run is er niets opgeslagen om te beoordelen.
  const lines = found.map(({ ev, found: f }) => `- ${ev.name_nl} (${ev.date}): € ${f.price}`)
  writeFileSync(
    REPORT_PATH,
    isLive && found.length
      ? `De prijszoeker heeft ${found.length} nieuw${found.length === 1 ? ' prijsvoorstel' : 'e prijsvoorstellen'} gevonden:\n\n` +
        `${lines.join('\n')}\n\n` +
        `Beoordeel ze in het admin-paneel (Toon → Met prijsvoorstel):\n${ADMIN_URL}\n`
      : '',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
