// Vult evenementen die al in de database staan aan met gegevens van
// hardlopen.nl (de kalender van de Atletiekunie):
//   - atletiekunie: true als hardlopen.nl het evenement als aangesloten toont
//   - organizer: alleen als die nog leeg is
//   - price: alleen als die nog leeg is ("", "volgt", "n.b.")
//   - registration_deadline / late_registration: alleen als die nog leeg zijn
// Koppelen: zelfde provincie en datum, en een naam die erop lijkt (of dezelfde
// plaats), net als scraper/entryfee-prices.js.
//
// Nieuwe evenementen voegt write-events.js toe (hardlopen.nl is daar de vijfde
// bron); dit script is voor de evenementen die we al via een andere bron hadden.
//
// Draaien:  node hardlopen-aanvullen.js          (dry-run)
//           node hardlopen-aanvullen.js --live   (slaat op)

try {
  process.loadEnvFile()
} catch {
  // geen .env
}

import { fetchHtml } from './lib/fetchPage.js'
import { collectHardlopenEvents } from './lib/parseHardlopen.js'
import { persistProvinceCache } from './lib/resolveProvince.js'
import { namesLikelyMatch } from './lib/nameSimilarity.js'
import { namesClearlyDifferent, normalize } from './lib/dedupe.js'
import { fetchPaged } from './lib/fetchPaged.js'

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const isLive = process.argv.includes('--live')
const NEEDS_PRICE = /^\s*$|volgt|n\.?\s?b\.?|onbekend/i

function onDate(ev, date) {
  return ev.date === date || (ev.end_date && ev.date <= date && date <= ev.end_date)
}

function findMatch(item, events) {
  const hits = events.filter(
    (ev) =>
      ev.province === item.provincie &&
      onDate(ev, item.datum) &&
      !namesClearlyDifferent(item.naam, ev.name_nl) &&
      (namesLikelyMatch(item.naam, ev.name_nl) || normalize(ev.city) === normalize(item.plaats)),
  )
  if (hits.length !== 1) return null
  // Alleen op plaats gekoppeld (naam anders)? Dan alleen het Atletiekunie-kenmerk,
  // geen organisator of prijs: daarvoor moet het zeker hetzelfde evenement zijn
  return { ev: hits[0], sure: namesLikelyMatch(item.naam, hits[0].name_nl) }
}

async function main() {
  if (!URL_BASE || !KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ontbreken (zie .env.example)')
  console.log(isLive ? '=== LIVE ===' : '=== DRY RUN (niets wordt opgeslagen) ===')
  const today = new Date().toISOString().slice(0, 10)
  const items = await collectHardlopenEvents(fetchHtml, { vanaf: today })
  persistProvinceCache()
  console.log(`${items.length} evenementen op hardlopen.nl (zonder trainingslopen)`)

  const res = await fetchPaged(
    `${URL_BASE}/rest/v1/events?select=id,name_nl,date,end_date,city,province,price,organizer,atletiekunie,registration_deadline,late_registration,max_participants,kidsrun&date=gte.${today}`,
    { headers: HEADERS },
  )
  if (!res.ok) throw new Error(`Kon events niet ophalen: HTTP ${res.status} (migratie 0010 al gedraaid?)`)
  const events = await res.json()

  const updates = []
  for (const item of items) {
    const match = findMatch(item, events)
    if (!match) continue
    const { ev, sure } = match
    const fields = {}
    if (item.atletiekunie && !ev.atletiekunie) fields.atletiekunie = true
    if (sure && item.organisator && !ev.organizer) fields.organizer = item.organisator
    if (sure && item.prijs && NEEDS_PRICE.test(ev.price || '')) fields.price = item.prijs
    if (sure && item.inschrijf_deadline && !ev.registration_deadline) fields.registration_deadline = item.inschrijf_deadline
    if (sure && item.na_inschrijving !== null && ev.late_registration === null) fields.late_registration = item.na_inschrijving
    if (sure && item.max_deelnemers && !ev.max_participants) fields.max_participants = item.max_deelnemers
    // Jeugdonderdeel op hardlopen.nl ("1,4 km – Jeugd") = kidsrun
    if (sure && !ev.kidsrun && item.afstanden.some((a) => /^kidsrun/i.test(a))) fields.kidsrun = true
    if (Object.keys(fields).length) updates.push({ ev, item, fields })
  }

  const count = (k) => updates.filter((u) => k in u.fields).length
  console.log(`\nAan te vullen: ${updates.length} evenementen (Atletiekunie ${count('atletiekunie')}, organisator ${count('organizer')}, prijs ${count('price')}, deadline ${count('registration_deadline')}, op de dag zelf ${count('late_registration')}, max. deelnemers ${count('max_participants')}, kidsrun ${count('kidsrun')})`)
  for (const { ev, fields } of updates) console.log(`  id ${ev.id} | ${ev.date} | ${ev.name_nl} -> ${JSON.stringify(fields)}`)

  if (isLive) {
    let ok = 0
    let failed = 0
    for (const { ev, fields } of updates) {
      const r = await fetch(`${URL_BASE}/rest/v1/events?id=eq.${ev.id}`, { method: 'PATCH', headers: HEADERS, body: JSON.stringify(fields) })
      r.ok ? ok++ : failed++
    }
    console.log(`\n${ok} events bijgewerkt, ${failed} mislukt.`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
