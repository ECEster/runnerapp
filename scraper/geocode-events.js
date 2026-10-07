// Vult lat/lng in voor events die nog geen coördinaten hebben, op basis van
// plaats + provincie (PDOK Locatieserver, zie lib/geocode.js). Nodig voor het
// postcode/straal-filter op de agenda en regiopagina's.
//
// Vereist dezelfde .env als write-events.js (SUPABASE_URL en
// SUPABASE_SERVICE_ROLE_KEY, zie .env.example).
//
// Droog draaien (alleen tonen):  node geocode-events.js
// Echt opslaan:                  node geocode-events.js --live

try {
  process.loadEnvFile()
} catch {
  // geen .env gevonden — prima als de omgevingsvariabelen al gezet zijn (CI)
}

import { fetchEventsMissingCoords, updateEventFields } from './lib/supabaseAdmin.js'
import { geocodePlace } from './lib/geocode.js'

const live = process.argv.includes('--live')

async function main() {
  const events = await fetchEventsMissingCoords()
  console.log(`${events.length} events zonder coördinaten`)

  // Elke plaats maar één keer opzoeken
  const byPlace = new Map()
  for (const ev of events) {
    const key = `${(ev.city || '').trim().toLowerCase()}|${ev.province || ''}`
    if (!byPlace.has(key)) byPlace.set(key, [])
    byPlace.get(key).push(ev)
  }

  let updated = 0
  const notFound = []
  for (const [key, group] of byPlace) {
    const { city, province } = group[0]
    const hit = await geocodePlace(city, province)
    if (!hit || hit.lat == null) {
      notFound.push(`${city} (${province || 'geen provincie'})`)
      continue
    }
    console.log(`${city} (${province || '-'}) → ${hit.naam} [${hit.lat.toFixed(4)}, ${hit.lng.toFixed(4)}] — ${group.length} event(s)`)
    if (live) {
      for (const ev of group) {
        await updateEventFields(ev.id, { lat: hit.lat, lng: hit.lng })
        updated++
      }
    }
  }

  if (notFound.length) console.log(`\nNiet gevonden (${notFound.length}):\n  ${notFound.join('\n  ')}`)
  console.log(live ? `\n${updated} events bijgewerkt.` : '\nDry-run: niets opgeslagen. Gebruik --live om op te slaan.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
