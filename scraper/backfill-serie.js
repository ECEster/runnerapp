// Eenmalig script: vult de nieuwe 'serie'-kolom (zie migrations/0002_add_serie_editie.sql)
// voor bestaande rijen in de events-tabel, met dezelfde buildSerie()-functie
// die write-events.js voor nieuwe events gebruikt.
//
// Vult ALLEEN rijen waar 'serie' nu leeg is — overschrijft nooit een waarde
// die er al staat (bv. een eerdere run van dit script, of een handmatige
// correctie in het admin-paneel).
//
// Meldt daarnaast (serie, date)-combinaties die na het invullen dubbel zouden
// zijn — dat kunnen twee losse rijen voor dezelfde editie zijn. Dit script
// LOST dat niet automatisch op (geen automatisch verwijderen/samenvoegen):
// controleer en corrigeer zulke gevallen zelf in het admin-paneel.
//
// Gebruik:
//   node backfill-serie.js              # dry-run (standaard, veilig)
//   node backfill-serie.js --live       # schrijft daadwerkelijk naar Supabase
//
// BELANGRIJK — volgorde: draai dit pas NA migrations/0002_add_serie_editie.sql
// en VÓÓR migrations/0003_unique_serie_date.sql (die unique constraint faalt
// als er dan nog dubbele (serie, date)-combinaties bestaan).
//
// Vereist een .env met SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY (zie .env.example).

try {
  process.loadEnvFile()
} catch {
  // Geen .env gevonden — prima als de omgevingsvariabelen al op een andere
  // manier gezet zijn.
}

import { buildSerie } from './lib/buildSerie.js'
import { fetchAllEventsForBackfill, updateEventFields } from './lib/supabaseAdmin.js'

const isLive = process.argv.includes('--live')

async function main() {
  console.log(isLive ? '=== LIVE MODUS — er wordt echt geschreven ===' : '=== DRY RUN (standaard, niets wordt geschreven) ===')

  console.log('\nStap 1/3: alle events ophalen...')
  const rows = await fetchAllEventsForBackfill()
  console.log(`  ${rows.length} rijen gevonden`)

  const toUpdate = []
  const skippedNoName = []

  for (const row of rows) {
    if (row.serie) continue // al gevuld — nooit overschrijven
    const serie = buildSerie({ naam: row.name_nl, plaats: row.city })
    if (!serie) {
      skippedNoName.push(row)
      continue
    }
    toUpdate.push({ ...row, serie })
  }

  console.log(
    `\nStap 2/3: ${toUpdate.length} rijen krijgen een berekende serie, ${rows.length - toUpdate.length - skippedNoName.length} hadden al een serie, ${skippedNoName.length} konden niet berekend worden (geen naam)`,
  )

  if (toUpdate.length > 0) {
    console.log('\nTe updaten:')
    for (const row of toUpdate) {
      console.log(`  - id ${row.id}: "${row.name_nl}" | ${row.date} -> ${row.serie}`)
    }
  }

  // Dubbelen-check: elke (serie, date)-combinatie die na het invullen meer
  // dan één rij zou hebben — op basis van de bestaande serie waar aanwezig,
  // anders de net berekende.
  const effectiveRows = rows.map((row) => {
    const existing = toUpdate.find((u) => u.id === row.id)
    return { id: row.id, name_nl: row.name_nl, date: row.date, serie: row.serie || existing?.serie || null }
  })
  const bySerieDate = new Map()
  for (const row of effectiveRows) {
    if (!row.serie || !row.date) continue
    const key = `${row.serie}|${row.date}`
    if (!bySerieDate.has(key)) bySerieDate.set(key, [])
    bySerieDate.get(key).push(row)
  }
  const duplicateGroups = [...bySerieDate.values()].filter((group) => group.length > 1)

  console.log(`\nStap 3/3: ${duplicateGroups.length} mogelijke dubbele edities gevonden (serie+datum komt meer dan eens voor)`)
  if (duplicateGroups.length > 0) {
    console.log('\n⚠️  Controleer deze handmatig in het admin-paneel (niets wordt automatisch verwijderd):')
    for (const group of duplicateGroups) {
      console.log(`  - serie+datum "${group[0].serie}" | ${group[0].date}:`)
      for (const row of group) {
        console.log(`      id ${row.id}: "${row.name_nl}"`)
      }
    }
  }

  if (!isLive) {
    console.log('\n(dry-run — geen --live vlag meegegeven, er wordt niets geschreven)')
    return
  }

  let updated = 0
  let failed = 0
  for (const row of toUpdate) {
    try {
      await updateEventFields(row.id, { serie: row.serie })
      updated++
    } catch (err) {
      failed++
      console.error(`  ✗ MISLUKT: id ${row.id} — ${err.message}`)
    }
  }

  console.log(`\nKlaar. ${updated} rijen bijgewerkt, ${failed} mislukt.`)
}

try {
  await main()
} catch (err) {
  console.error(`\n✗ Gestopt door een fout: ${err.message}`)
  process.exitCode = 1
}
