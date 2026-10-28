// Zoekt de organisator op de site van het evenement (de inschrijflink) en vult
// het veld 'organizer' alleen als er een DUIDELIJKE organisatie gevonden wordt:
// een naam met een woord als vereniging, stichting, AV, club of loopgroep.
// Bij twijfel blijft het veld leeg — liever niets dan een verkeerde naam.
//
// Bronnen op de pagina, in volgorde van betrouwbaarheid:
//   1. tekst "georganiseerd door X" / "Organisatie: X" / "Organisator: X"
//   2. gestructureerde gegevens (JSON-LD) organizer.name of Organization.name
//   3. de naam die de site zelf opgeeft (og:site_name / <title>) — alleen als dat
//      een club-achtige naam is (bv. de site van een atletiekvereniging)
//
// Draaien:  node find-organizers.js          (dry-run: toont wat er ingevuld zou worden)
//           node find-organizers.js --live   (vult 'organizer' in de database)
// Uitvoer:  .cache/organisatoren.json

try {
  process.loadEnvFile()
} catch {
  // geen .env
}

import { mkdirSync, writeFileSync } from 'node:fs'

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const isLive = process.argv.includes('--live')

const SKIP_HOSTS = /(hardloopkalendernederland|runphy|loopjeloopje|facebook\.com|instagram\.com|google\.|inschrijven\.nl|mylaps|uitslagen|atleta|njuko|eventbrite|ticketmaster|lopers\.nl)/i
// Woorden die een organisatie kenmerken
const ORG_WORD = /\b(a\.?v\.?|atletiek\w*|vereniging|stichting|loopgroep|loopvereniging|hardloopvereniging|running\s?club|runners?\s?club|club|sportvereniging|s\.?v\.?|l\.?v\.?|triathlon\s?(club|vereniging)|ttc|a\.?a\.?c\.?|organisatiecomit[ée]|comit[ée])\b/i
// Wat er niet in een organisatienaam hoort
const BAD = /(cookie|privacy|javascript|inschrijv|klik|lees meer|home|menu|©|copyright|\bwww\.|https?:|@|\d{4}\s*-\s*\d{4}|atletiekbaan|sportpark|weg \d|straat|laan \d|\bkvk\b|startpagina|actief in)/i
// Agenda-/kalenderpagina's van clubs tonen ook evenementen van anderen: daar
// alleen een organisator overnemen als het er letterlijk staat (tekst)
const AGENDA_PATH = /\/(agenda|kalender|evenementen|events?|wedstrijden)\//i

const pageCache = new Map()

const NAMED = { amp: '&', quot: '"', apos: "'", nbsp: ' ', middot: '·', ndash: '–', mdash: '—', rsquo: "'", lsquo: "'", eacute: 'é', euml: 'ë', uuml: 'ü', ouml: 'ö', acute: "'" }
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (e, c) => {
    if (c[0] === '#') {
      const n = c[1].toLowerCase() === 'x' ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : e
    }
    return NAMED[c.toLowerCase()] ?? e
  }).replace(/[‘’´`]/g, "'")
}

async function fetchPage(url) {
  if (pageCache.has(url)) return pageCache.get(url)
  let page = null
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 12000)
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (RunningNederland.nl organisatorcheck)' } })
    clearTimeout(t)
    if (res.ok && (res.headers.get('content-type') || '').includes('html')) page = await res.text()
  } catch {
    // onbereikbaar
  }
  pageCache.set(url, page)
  return page
}

function clean(name) {
  let n = decode(name).replace(/\s+/g, ' ').trim()
  n = n.split(/(?<=\p{L}{2})\.\s/u)[0]                 // eerste zin (niet splitsen in "C.A.V. Energie")
  n = n.replace(/^(de|het)\s+/i, '')
  n = n.replace(/\([^)]*\)/g, ' ').replace(/["“”]/g, '') // (kvk: ...) en aanhalingstekens
  n = n.split(/\s+(?:en|in nauwe samenwerking|in samenwerking|i\.?s\.?m\.?|met|uit|te|op|voor|is|organiseert|organiseren|presenteert)(?:\s+|$)/i)[0]
  n = n.replace(/^(?:door\s+)?(?:een\s+)?(?:vrijwilligers(?:team)?|projectgroep)\s+van\s+/i, '')
  n = n.replace(/^(de|het)\s+/i, '')
  // "GVAC, de atletiekvereniging" / "Loopgroep SGO, Gieten": alleen het eerste deel
  const comma = n.match(/^(.+?),\s+(.+)$/)
  if (comma && (/^(de|het)\s/i.test(comma[2]) || comma[2].split(' ').length <= 2)) n = comma[1]
  n = n.replace(/[^\p{L}\p{N}'.)&]+$/u, '').replace(/^[^\p{L}\p{N}'(]+/u, '')
  n = n.replace(/(?<=\p{Ll})\.$/u, '')                  // slotpunt na een gewoon woord
  n = n.replace(/\s+\p{L}$/u, '')                       // afgekapte losse letter
  n = n.replace(/\s+/g, ' ').trim()
  return n ? n[0].toUpperCase() + n.slice(1) : n
}

function acceptable(name) {
  if (!name) return false
  if (name.length < 4 || name.length > 60) return false
  if (BAD.test(name)) return false
  if (!ORG_WORD.test(name)) return false
  if (name.split(' ').length > 8) return false
  // Alleen algemene woorden ("Atletiekvereniging", "Atletiek AC") is geen naam
  const GENERIC = /^(de|het|av|sv|lv|ac|atletiek|atletiekvereniging|vereniging|stichting|club|loopgroep|hardloopvereniging|sportvereniging)$/i
  const specific = name.split(/[\s,]+/).filter((w) => w && !GENERIC.test(w.replace(/[.']/g, '')))
  if (!specific.length) return false
  if (/^[A-Z](\.[A-Z])+\.?$/.test(name)) return false   // alleen een afgekapte afkorting
  return true
}

function fromText(html) {
  const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '\n'))
  const re = /(?:georganiseerd\s+door|wordt\s+georganiseerd\s+door|organisatie\s*:|organisator\s*:|organisatie\s+is\s+in\s+handen\s+van|een\s+organisatie\s+van)\s*([^\n!?]{3,90})/gi
  let m
  while ((m = re.exec(text))) {
    const n = clean(m[1])
    if (acceptable(n)) return { name: n, how: 'tekst' }
  }
  return null
}

function fromJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const b of blocks) {
    let d
    try { d = JSON.parse(b[1]) } catch { continue }
    const nodes = [].concat(d['@graph'] || d)
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const org = [].concat(node.organizer || [])[0]
      const cands = [org && org.name, node['@type'] === 'Organization' || node['@type'] === 'SportsOrganization' ? node.name : null]
      for (const c of cands) {
        if (typeof c === 'string' && acceptable(clean(c))) return { name: clean(c), how: 'gegevens' }
      }
    }
  }
  return null
}

function fromSiteName(html) {
  const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i)
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  for (const raw of [og && og[1], title && title[1]]) {
    if (!raw) continue
    // titels als "Inschrijven | AV Spirit" -> losse delen proberen
    for (const part of decode(raw).split(/\s+[|–—·-]\s+/)) {
      const n = clean(part)
      if (acceptable(n)) return { name: n, how: 'sitenaam' }
    }
  }
  return null
}

async function findOrganizer(ev) {
  const url = ev.registration_url
  if (!url || !/^https?:\/\//i.test(url) || SKIP_HOSTS.test(url)) return null
  const html = await fetchPage(url)
  if (!html) return null
  const fromPage = fromText(html)
  if (fromPage) return fromPage
  let path = ''
  try { path = new URL(url).pathname } catch { /* ongeldige url */ }
  if (AGENDA_PATH.test(path)) return null
  return fromJsonLd(html) || fromSiteName(html)
}

async function main() {
  if (!URL_BASE || !KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ontbreken (zie .env.example)')
  const today = new Date().toISOString().slice(0, 10)
  const res = await fetch(`${URL_BASE}/rest/v1/events?select=id,name_nl,date,city,registration_url,organizer&date=gte.${today}&or=(organizer.is.null,organizer.eq.)&order=date`, { headers: HEADERS })
  const events = await res.json()
  console.log(isLive ? '=== LIVE ===' : '=== DRY RUN (niets wordt opgeslagen) ===')
  console.log(`${events.length} komende events zonder organisator`)

  const found = []
  const queue = [...events]
  let done = 0
  async function worker() {
    while (queue.length) {
      const ev = queue.shift()
      const r = await findOrganizer(ev)
      if (r) found.push({ id: ev.id, naam: ev.name_nl, datum: ev.date, plaats: ev.city, organisator: r.name, bron: r.how, url: ev.registration_url })
      if (++done % 100 === 0) console.log(`  ${done}/${events.length} bekeken, ${found.length} gevonden`)
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))
  found.sort((a, b) => a.datum.localeCompare(b.datum))
  mkdirSync('.cache', { recursive: true })
  writeFileSync('.cache/organisatoren.json', JSON.stringify(found, null, 2))

  console.log(`\n${found.length} organisatoren gevonden:`)
  for (const f of found) console.log(`  [${f.bron}] id ${f.id} | ${f.naam} | ${f.plaats} -> ${f.organisator}`)

  if (isLive) {
    let ok = 0
    for (const f of found) {
      const r = await fetch(`${URL_BASE}/rest/v1/events?id=eq.${f.id}`, { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ organizer: f.organisator }) })
      if (r.ok) ok++
    }
    console.log(`\n${ok} events bijgewerkt.`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
