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
import { fetchExistingEventKeys, insertEventRow, updateEventFields } from './lib/supabaseAdmin.js'

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

  const { toInsert, toMerge, skipped } = dedupeAgainstDb(unique, existingRows)
  console.log(
    `\nStap 3/4: ${toInsert.length} nieuw, ${toMerge.length} aan te vullen, ${skipped.length} overgeslagen (al compleet)`,
  )

  if (toMerge.length > 0) {
    console.log('\nAan te vullen (bestaande rij, alleen lege velden):')
    for (const { event, existingId, fillable } of toMerge) {
      console.log(`  - id ${existingId}: ${event.naam} | ${event.datum} | velden: ${Object.keys(fillable).join(', ')}`)
    }
  }

  if (skipped.length > 0) {
    console.log('\nOvergeslagen (bestaan al, niets aan te vullen):')
    for (const e of skipped) {
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

  console.log(
    `\nStap 4/4: ${toInsert.length} nieuwe rijen en ${toMerge.length} aanvullingen ` +
      `${isLive ? 'schrijven naar' : 'die geschreven zouden worden naar'} Supabase`,
  )

  if (!isLive) {
    console.log('\n(dry-run — geen --live vlag meegegeven, er wordt niets geschreven)\n')
    console.log('Nieuwe rijen (published: false):')
    console.log(JSON.stringify(toInsert.map(mapToSupabaseShape), null, 2))
    console.log('\nAanvullingen op bestaande rijen:')
    console.log(JSON.stringify(toMerge.map(({ existingId, fillable }) => ({ existingId, fillable })), null, 2))
    return
  }

  let inserted = 0
  let updated = 0
  let failed = 0

  for (const event of toInsert) {
    const row = mapToSupabaseShape(event)
    try {
      const result = await insertEventRow(row)
      inserted++
      console.log(`  ✓ toegevoegd (id ${result.id}): ${row.name_nl} | ${row.date} | ${row.city}`)
    } catch (err) {
      failed++
      console.error(`  ✗ MISLUKT (toevoegen): ${row.name_nl} | ${row.date} | ${row.city} — ${err.message}`)
    }
  }

  for (const { event, existingId, fillable } of toMerge) {
    try {
      await updateEventFields(existingId, fillable)
      updated++
      console.log(`  ✓ aangevuld (id ${existingId}): ${event.naam} | ${event.datum} | velden: ${Object.keys(fillable).join(', ')}`)
    } catch (err) {
      failed++
      console.error(`  ✗ MISLUKT (aanvullen): id ${existingId} — ${err.message}`)
    }
  }

  console.log(
    `\nKlaar. ${inserted} toegevoegd, ${updated} aangevuld, ${failed} mislukt, ${skipped.length} overgeslagen (bestonden al compleet).`,
  )
  if (inserted > 0) {
    console.log('Alle nieuwe rijen staan met published: false — controleer en publiceer ze in het admin-portaal.')
  }
}

try {
  await main()
} catch (err) {
  console.error(`\n✗ Gestopt door een fout: ${err.message}`)
  process.exitCode = 1
}
