// Haalt inschrijfgelden van entryfee.run (per provincie) en zet ze bij de
// bijpassende evenementen in de database. entryfee.run haalt elke prijs zelf
// dagelijks van de site van de organisator en toont hem per afstand; wij maken
// daar een bereik van ("22,50 - 27,50").
//
// Koppelen aan een evenement in de database: zelfde provincie, zelfde datum
// (of binnen start-/einddatum), en een naam die erop lijkt.
//   - Naam én plaats komen overeen  -> prijs direct invullen (kolom 'price')
//   - Alleen naam óf plaats          -> als voorstel in het admin-paneel
//                                       (price_suggestion), met de prijzen per
//                                       afstand als zinnetje erbij
// Alleen evenementen zonder prijs ("", "volgt", "n.b.") worden aangevuld; een
// bestaande prijs wordt nooit overschreven. Afwijkingen staan wel in de log.
//
// Draaien:  node entryfee-prices.js          (dry-run: toont wat er zou gebeuren)
//           node entryfee-prices.js --live   (slaat op)
// Uitvoer:  .cache/entryfee.json

try {
  process.loadEnvFile()
} catch {
  // geen .env
}

import { mkdirSync, writeFileSync } from 'node:fs'
import { namesLikelyMatch } from './lib/nameSimilarity.js'
import { namesClearlyDifferent, normalize } from './lib/dedupe.js'
import { fetchPaged } from './lib/fetchPaged.js'

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const isLive = process.argv.includes('--live')
const NEEDS_PRICE = /^\s*$|volgt|n\.?\s?b\.?|onbekend/i

// slug op entryfee.run -> provincienaam in onze database
const PROVINCES = {
  groningen: 'Groningen', fryslan: 'Friesland', drenthe: 'Drenthe',
  overijssel: 'Overijssel', gelderland: 'Gelderland', flevoland: 'Flevoland',
  'noord-brabant': 'Noord-Brabant', limburg: 'Limburg',
  'noord-holland': 'Noord-Holland', 'zuid-holland': 'Zuid-Holland', utrecht: 'Utrecht', zeeland: 'Zeeland',
}
const MONTHS = { jan: 1, feb: 2, mrt: 3, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, dec: 12 }

const NAMED = { amp: '&', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", ndash: '–' }
function decode(s) {
  return String(s)
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (e, c) => {
      if (c[0] === '#') return String.fromCodePoint(c[1].toLowerCase() === 'x' ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10))
      return NAMED[c.toLowerCase()] ?? e
    })
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function toIsoDate(text) {
  const m = /(\d{1,2}) ([a-z]{3}) (20\d\d)/i.exec(text)
  if (!m || !MONTHS[m[2].toLowerCase()]) return null
  return `${m[3]}-${String(MONTHS[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

function euro(text) {
  const m = /€\s*([\d.]+(?:,\d+)?)/.exec(text || '')
  return m ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) : null
}

// 22.5 -> "22,50", 25 -> "25"
function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',')
}

// Eén rij op entryfee.run = één afstand van een evenement
function parseRows(html, province) {
  const rows = []
  for (const li of html.match(/<li class="rrow[\s\S]*?<\/li>/g) || []) {
    const link = /<a class="rrow-link" href="\/nl\/race\/([^"]+)">([\s\S]*?)<\/a>/.exec(li)
    const sub = /<div class="rrow-sub">([\s\S]*?)<\/div>/.exec(li)
    const price = /<span class="price">([\s\S]*?)<\/span>/.exec(li)
    const src = /<a class="rrow-src" href="([^"]+)"/.exec(li)
    if (!link || !sub || !price) continue
    const subText = decode(sub[1]) // "5,00 km · Weg · 6 nov 2026 · Lelystad"
    const parts = subText.split(' · ')
    const date = toIsoDate(subText)
    const amount = euro(decode(price[1]))
    if (!date || amount === null) continue
    // Een paar organisatoren noemen bij 5 of 10 km de teamprijs (bv. € 215 of
    // € 350): boven € 60 voor een afstand t/m de halve marathon slaan we over
    const km = parseFloat((/([\d,.]+)\s*km/i.exec(parts[0]) || [])[1]?.replace(',', '.'))
    if (km && km <= 21.1 && amount > 60) continue
    rows.push({
      race: link[1],
      name: decode(link[2]),
      distance: parts[0],
      date,
      city: parts[parts.length - 1],
      province,
      amount,
      source: src ? decode(src[1]) : `https://entryfee.run/nl/race/${link[1]}`,
    })
  }
  return rows
}

async function fetchProvince(slug) {
  const res = await fetch(`https://entryfee.run/nl/province/${slug}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (RunningNederland.nl prijscheck)' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`entryfee.run/${slug}: HTTP ${res.status}`)
  return res.text()
}

// Rijen per evenement (race + datum) samenvoegen tot een prijsbereik
function groupRaces(rows) {
  const map = new Map()
  for (const r of rows) {
    const key = `${r.race}|${r.date}`
    if (!map.has(key)) map.set(key, { ...r, items: [] })
    map.get(key).items.push({ distance: r.distance, amount: r.amount })
  }
  return [...map.values()].map((race) => {
    const amounts = race.items.map((i) => i.amount)
    const lo = Math.min(...amounts)
    const hi = Math.max(...amounts)
    return {
      ...race,
      price: hi === 0 ? 'gratis' : lo === hi ? fmt(lo) : `${fmt(lo)} - ${fmt(hi)}`,
      quote: 'entryfee.run: ' + race.items.map((i) => `${i.distance} € ${fmt(i.amount)}`).join(' · '),
    }
  })
}

function onDate(ev, date) {
  return ev.date === date || (ev.end_date && ev.date <= date && date <= ev.end_date)
}

function findMatch(race, events) {
  const candidates = events.filter((ev) => ev.province === race.province && onDate(ev, race.date))
  let best = null
  for (const ev of candidates) {
    const nameOk = namesLikelyMatch(race.name, ev.name_nl) && !namesClearlyDifferent(race.name, ev.name_nl)
    const cityOk = normalize(ev.city) === normalize(race.city)
    if (!nameOk && !(cityOk && !namesClearlyDifferent(race.name, ev.name_nl))) continue
    const strength = nameOk && cityOk ? 2 : 1
    if (!best || strength > best.strength) best = { ev, strength, ambiguous: false }
    else if (strength === best.strength) best.ambiguous = true
  }
  return best && !best.ambiguous ? best : null
}

async function main() {
  if (!URL_BASE || !KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ontbreken (zie .env.example)')
  console.log(isLive ? '=== LIVE ===' : '=== DRY RUN (niets wordt opgeslagen) ===')

  const rows = []
  for (const [slug, province] of Object.entries(PROVINCES)) {
    const html = await fetchProvince(slug)
    const found = parseRows(html, province)
    console.log(`  ${province}: ${found.length} afstanden met prijs`)
    rows.push(...found)
  }
  const today = new Date().toISOString().slice(0, 10)
  const races = groupRaces(rows).filter((r) => r.date >= today)
  console.log(`${races.length} komende evenementen met prijs op entryfee.run`)

  const res = await fetchPaged(
    `${URL_BASE}/rest/v1/events?select=id,name_nl,date,end_date,city,province,price,price_suggestion,price_suggestion_rejected&date=gte.${today}`,
    { headers: HEADERS },
  )
  if (!res.ok) throw new Error(`Kon events niet ophalen: HTTP ${res.status}`)
  const events = await res.json()

  const direct = []
  const suggest = []
  const differs = []
  let unmatched = 0
  const used = new Set()
  for (const race of races) {
    const m = findMatch(race, events)
    if (!m || used.has(m.ev.id)) { unmatched++; continue }
    used.add(m.ev.id)
    const ev = m.ev
    if (!NEEDS_PRICE.test(ev.price || '')) {
      if (normalize(ev.price) !== normalize(race.price)) differs.push({ ev, race })
      continue
    }
    if (m.strength === 2) direct.push({ ev, race })
    else if (ev.price_suggestion !== race.price && ev.price_suggestion_rejected !== race.price) suggest.push({ ev, race })
  }

  console.log(`\nDirect invullen (naam + plaats kloppen): ${direct.length}`)
  for (const { ev, race } of direct) console.log(`  id ${ev.id} | ${ev.date} | ${ev.name_nl} (${ev.city}) -> € ${race.price}`)
  console.log(`\nAls voorstel (naam óf plaats klopt): ${suggest.length}`)
  for (const { ev, race } of suggest) console.log(`  id ${ev.id} | ${ev.date} | ${ev.name_nl} (${ev.city}) ~ ${race.name} (${race.city}) -> € ${race.price}`)
  console.log(`\nAl een prijs, maar entryfee.run noemt iets anders (niet aangepast): ${differs.length}`)
  for (const { ev, race } of differs) console.log(`  id ${ev.id} | ${ev.name_nl}: nu € ${ev.price}, entryfee € ${race.price}`)
  console.log(`\nNiet gekoppeld (staat niet in onze database of naam te anders): ${unmatched}`)

  mkdirSync('.cache', { recursive: true })
  writeFileSync('.cache/entryfee.json', JSON.stringify({ direct, suggest, differs: differs.map(({ ev, race }) => ({ id: ev.id, naam: ev.name_nl, nu: ev.price, entryfee: race.price, bron: race.quote })) }, null, 2))

  if (isLive) {
    let ok = 0
    let failed = 0
    const now = new Date().toISOString()
    const patch = async (id, fields) => {
      const r = await fetch(`${URL_BASE}/rest/v1/events?id=eq.${id}`, { method: 'PATCH', headers: HEADERS, body: JSON.stringify(fields) })
      r.ok ? ok++ : failed++
    }
    for (const { ev, race } of direct) {
      await patch(ev.id, { price: race.price, price_suggestion: null, price_suggestion_quote: null, price_suggestion_url: null, price_checked_at: now })
    }
    for (const { ev, race } of suggest) {
      await patch(ev.id, { price_suggestion: race.price, price_suggestion_quote: race.quote, price_suggestion_url: race.source, price_checked_at: now })
    }
    console.log(`\n${ok} events bijgewerkt, ${failed} mislukt.`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
