// Haalt events op, dedupliceert (onderling én tegen wat al in de database staat), en
// schrijft ze naar Supabase — MAAR ALLEEN als je --live meegeeft. Standaard is dit een
// dry-run die alleen print wat er zou gebeuren.
//
// Gebruik:
//   node write-events.js              # dry-run (standaard, veilig)
//   node write-events.js --live       # schrijft daadwerkelijk naar Supabase
//
// Vereist een .env met SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY (zie .env.example).

try {
  process.loadEnvFile()
} catch {
  // Geen .env gevonden — prima als de omgevingsvariabelen op een andere manier zijn
  // gezet (bv. door een geplande taak/CI). fetchExistingEventKeys/insertEventRow geven
  // zelf een duidelijke foutmelding als de variabelen alsnog ontbreken.
}

import { collectEvents } from './lib/collectEvents.js'
import { dedupeAgainstDb } from './lib/dedupeAgainstDb.js'
import { mapToSupabaseShape } from './lib/mapToSupabaseShape.js'
import { fetchExistingEventKeys, insertEventRow } from './lib/supabaseAdmin.js'

const MAX_INSERTS_PER_RUN = 50

const isLive = process.argv.includes('--live')

async function main() {
  console.log(isLive ? '=== LIVE MODUS — er wordt echt geschreven ===' : '=== DRY RUN (standaard, niets wordt geschreven) ===')

  console.log('\nStap 1/4: events ophalen en parsen van beide bronnen...')
  const { unique, duplicates } = await collectEvents({ year: 2026 })
  console.log(`  ${unique.length} unieke events gevonden (${duplicates.length} onderlinge duplicaten weggefilterd)`)

  console.log('\nStap 2/4: bestaande events in Supabase ophalen voor dedupliceer-check...')
  const existingRows = await fetchExistingEventKeys()
  console.log(`  ${existingRows.length} events staan al in de database`)

  const { toInsert, alreadyExists } = dedupeAgainstDb(unique, existingRows)
  console.log(`\nStap 3/4: ${toInsert.length} nieuw, ${alreadyExists.length} bestaan al (overgeslagen)`)

  if (alreadyExists.length > 0) {
    console.log('\nOvergeslagen (bestaan al):')
    for (const e of alreadyExists) {
      console.log(`  - ${e.naam} | ${e.datum} | ${e.plaats}`)
    }
  }

  if (toInsert.length > MAX_INSERTS_PER_RUN) {
    console.error(
      `\n⚠️  STOP: deze run zou ${toInsert.length} nieuwe events wegschrijven — dat is meer dan de ` +
        `veiligheidslimiet van ${MAX_INSERTS_PER_RUN}. Dit is een signaal dat er mogelijk iets mis is met ` +
        `een parser (bv. een bron die een heel andere pagina teruggeeft). Er is niets geschreven.\n` +
        `Controleer de output hierboven; verhoog MAX_INSERTS_PER_RUN in write-events.js pas nadat je hebt ` +
        `bevestigd dat de data klopt.`,
    )
    process.exitCode = 1
    return
  }

  console.log(`\nStap 4/4: ${toInsert.length} nieuwe events ${isLive ? 'schrijven naar' : 'die geschreven zouden worden naar'} Supabase (published: false)`)

  if (!isLive) {
    console.log('\n(dry-run — geen --live vlag meegegeven, er wordt niets geschreven)\n')
    console.log(JSON.stringify(toInsert.map(mapToSupabaseShape), null, 2))
    return
  }

  let succeeded = 0
  let failed = 0

  for (const event of toInsert) {
    const row = mapToSupabaseShape(event)
    try {
      const inserted = await insertEventRow(row)
      succeeded++
      console.log(`  ✓ toegevoegd (id ${inserted.id}): ${row.name_nl} | ${row.date} | ${row.city}`)
    } catch (err) {
      failed++
      console.error(`  ✗ MISLUKT: ${row.name_nl} | ${row.date} | ${row.city} — ${err.message}`)
    }
  }

  console.log(`\nKlaar. ${succeeded} toegevoegd, ${failed} mislukt, ${alreadyExists.length} overgeslagen (bestonden al).`)
  if (succeeded > 0) {
    console.log('Alle nieuwe rijen staan met published: false — controleer en publiceer ze in het admin-portaal.')
  }
}

try {
  await main()
} catch (err) {
  console.error(`\n✗ Gestopt door een fout: ${err.message}`)
  process.exitCode = 1
}
