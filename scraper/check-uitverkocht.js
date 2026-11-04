// Kijkt op de inschrijfpagina van komende evenementen of er staat dat het
// evenement (of een onderdeel) uitverkocht of vol is, en zet dat als VOORSTEL
// klaar in het admin-paneel (Toon -> "Met uitverkocht-voorstel"). Op de site
// verandert niets tot je het voorstel invult en opslaat.
//
// Herkent zinnen als "Halve marathon UITVERKOCHT", "de kidsrun is vol",
// "sold out", "maximaal aantal deelnemers bereikt". Noemt de zin een afstand
// (Kidsrun, 5 km, halve marathon, ...), dan wordt het voorstel die afstand;
// anders "uitverkocht" (het hele evenement). "Bijna uitverkocht" telt niet.
// Een overgeslagen voorstel wordt niet opnieuw voorgesteld, tenzij de site
// iets anders noemt.
//
// Vereist migratie 0011_add_availability.sql.
//
// Draaien:  node check-uitverkocht.js          (dry-run)
//           node check-uitverkocht.js --live   (slaat de voorstellen op)

try {
  process.loadEnvFile()
} catch {
  // geen .env
}

import { htmlToText } from './lib/extractPrice.js'

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const isLive = process.argv.includes('--live')
const SKIP_HOSTS = /(hardloopkalendernederland|runphy|loopjeloopje|facebook\.com|instagram\.com|google\.)/i

const FULL = /uitverkocht(?!e)|sold[\s-]?out|volgeboekt|\b(?:is|zijn|inmiddels)\s+vol\b(?!\s*(?:=|enthousiasme|energie|plezier|sfeer|verwachting))|maximum\s+(?:aantal\s+)?(?:deelnemers|inschrijvingen)\s+(?:is\s+)?bereikt|maximaal\s+aantal\s+deelnemers\s+(?:is\s+)?bereikt/gi
const NOT_FULL = /bijna|vrijwel|snel|voordat|voor\s+het|zodra|als\s+(?:het|een)|wanneer|mits|tot\s+het\s+moment|vorig\s+jaar|vorige|voorgaande|\bwas\b|\bwaren\b|\bwerd\b|editie\s+van\s+20\d\d|niet\s+(?:uitverkocht|vol)|nog\s+niet|t-?shirt|shirt|medaille|camping|parkeer|diner|pasta|business|bedrijven|deal|passe.?partout|seizoen/i
// Terugblik vlak na het woord: "uitverkocht in een week", "binnen 12 uur uitverkocht"
const AFTER_PAST = /^\W{0,3}(?:in\s+een|binnen|met\s+het|en\s+daarom|!?\s*een\s+record)/i
const PART = [
  [/kids\s?run|kinderloop|jeugd(?:loop)?|mini[\s-]?run|kidsloop/i, 'Kidsrun'],
  [/halve\s+marathon|21[,.]1\s?km/i, 'Halve marathon'],
  [/kwart\s+marathon/i, 'Kwart marathon'],
  [/(?<!halve\s|kwart\s)\bmarathon\b|42[,.]2\s?km/i, 'Marathon'],
  [/\b(\d{1,2}(?:[,.]\d)?)\s?(?:km|kilometer)\b/i, null],
  [/\b(\d{1,2})\s?(?:engelse\s)?mijl\b/i, null],
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (RunningNederland.nl beschikbaarheid)' },
      signal: AbortSignal.timeout(12000),
    })
    if (res.ok && (res.headers.get('content-type') || '').includes('html')) return await res.text()
  } catch {
    // onbereikbaar
  }
  return null
}

// Zoekt in een stukje tekst de afstand die het laatst ('last') of het eerst
// ('first') voorkomt, en geeft die als label terug ("Kidsrun", "10 km", ...)
function closestPart(snippet, which) {
  let best = null
  for (const [re, label] of PART) {
    for (const p of snippet.matchAll(new RegExp(re.source, 'gi'))) {
      const pos = p.index
      if (!best || (which === 'last' ? pos > best.pos : pos < best.pos)) {
        best = { pos, label: label || `${p[1].replace('.', ',')} ${/mijl/i.test(p[0]) ? 'mijl' : 'km'}` }
      }
    }
  }
  return best && best.label
}

// Geeft { suggestion, quote } of null
export function findSoldOut(text, eventYear) {
  const parts = new Set()
  let whole = false
  let quote = null
  let m
  FULL.lastIndex = 0
  while ((m = FULL.exec(text))) {
    const from = Math.max(0, m.index - 70)
    const window = text.slice(from, m.index + m[0].length + 30)
    const before = text.slice(Math.max(0, m.index - 40), m.index)
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 25)
    if (NOT_FULL.test(before) || NOT_FULL.test(m[0]) || AFTER_PAST.test(after)) continue
    // Noemt het stukje alleen een eerder jaar? Dan gaat het over vorig jaar
    const years = (window.match(/\b20\d\d\b/g) || []).map(Number)
    if (years.length && !years.includes(eventYear) && Math.max(...years) < eventYear) continue
    // De afstand die het dichtst vóór het woord staat (± 40 tekens), bv.
    // "10 km UITVERKOCHT"; anders vlak erna ("UITVERKOCHT: halve marathon")
    const part = closestPart(text.slice(Math.max(0, m.index - 40), m.index), 'last') ||
      closestPart(text.slice(m.index + m[0].length, m.index + m[0].length + 25), 'first')
    if (part) parts.add(part)
    else whole = true
    if (!quote) quote = window.trim()
  }
  if (!quote) return null
  // "Uitverkocht" zonder afstand terwijl er ook afstanden genoemd worden: liever de afstanden
  const suggestion = parts.size ? [...parts].join(', ') : whole ? 'uitverkocht' : null
  return suggestion ? { suggestion, quote: quote.slice(0, 220) } : null
}

async function main() {
  if (!URL_BASE || !KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ontbreken (zie .env.example)')
  console.log(isLive ? '=== LIVE ===' : '=== DRY RUN (niets wordt opgeslagen) ===')
  const today = new Date().toISOString().slice(0, 10)
  const res = await fetch(
    `${URL_BASE}/rest/v1/events?select=id,name_nl,date,registration_url,sold_out,sold_out_distances,sold_out_suggestion,sold_out_suggestion_rejected&date=gte.${today}&published=eq.true&order=date`,
    { headers: HEADERS },
  )
  if (!res.ok) throw new Error(`Kon events niet ophalen: HTTP ${res.status} (migratie 0011 al gedraaid?)`)
  const events = (await res.json()).filter((ev) => !ev.sold_out && ev.registration_url && /^https?:\/\//i.test(ev.registration_url) && !SKIP_HOSTS.test(ev.registration_url))
  console.log(`${events.length} komende evenementen om te bekijken`)

  const found = []
  const queue = [...events]
  let done = 0
  async function worker() {
    while (queue.length) {
      const ev = queue.shift()
      const html = await fetchPage(ev.registration_url)
      const r = html && findSoldOut(htmlToText(html), Number(ev.date.slice(0, 4)))
      if (r && r.suggestion !== ev.sold_out_suggestion_rejected && r.suggestion !== ev.sold_out_distances && r.suggestion !== ev.sold_out_suggestion) {
        found.push({ ev, ...r })
      }
      if (++done % 100 === 0) console.log(`  ${done}/${events.length} bekeken, ${found.length} gevonden`)
      await sleep(200)
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))
  found.sort((a, b) => a.ev.date.localeCompare(b.ev.date))

  console.log(`\n${found.length} voorstellen:`)
  for (const f of found) console.log(`  id ${f.ev.id} | ${f.ev.date} | ${f.ev.name_nl} -> ${f.suggestion}\n      "${f.quote}"`)

  if (isLive) {
    let ok = 0
    for (const f of found) {
      const r = await fetch(`${URL_BASE}/rest/v1/events?id=eq.${f.ev.id}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({ sold_out_suggestion: f.suggestion, sold_out_suggestion_quote: f.quote, sold_out_suggestion_url: f.ev.registration_url }),
      })
      if (r.ok) ok++
    }
    console.log(`\n${ok} voorstellen opgeslagen. Bekijk ze in het admin-paneel: Toon -> "Met uitverkocht-voorstel".`)
  }
}

// Alleen starten als script (niet bij importeren voor een test)
if (process.argv[1]?.endsWith('check-uitverkocht.js')) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
