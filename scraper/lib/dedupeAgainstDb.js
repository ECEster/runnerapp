// Vergelijkt gescrapete events met wat al in de database staat, aan de hand
// van de stabiele (serie, date)-combinatie (zie lib/buildSerie.js) — niet
// meer via fuzzy naam/plaats-matching zoals voorheen. Reden: elke jaargang
// van een terugkerend evenement moet een eigen rij blijven, gekoppeld via
// dezelfde 'serie'; datum+serie is daarmee een exactere sleutel dan
// datum+plaats-of-naam.
//
// Drie mogelijke uitkomsten per event:
// - toInsert: geen bestaande rij met deze (serie, date) -> nieuwe rij.
// - toMerge: bestaande rij gevonden mét minstens één leeg veld dat de
//   kandidaat wél heeft -> alleen die lege velden aanvullen (nooit een
//   bestaande, niet-lege waarde overschrijven — de reviewer corrigeert soms
//   handmatig via het admin-paneel).
// - skipped: bestaande rij gevonden, niets aan te vullen.
//
// Bekende beperking: events waarvan de bestaande rij nog geen 'serie' heeft
// (vóór het draaien van backfill-serie.js) worden hier niet herkend als
// duplicaat — zie scraper/README.md voor de vereiste volgorde (eerst
// migreren + backfillen, dan pas op deze matchlogica vertrouwen).
import { mapToSupabaseShape } from './mapToSupabaseShape.js'

// Velden die de scraper daadwerkelijk met een echte waarde kan aanleveren
// (zie mapToSupabaseShape.js) en die dus zinvol zijn om aan te vullen op een
// bestaande rij. 'serie' zelf staat hier bewust niet in — dat is de
// matchsleutel, niet een aan te vullen veld — en evenmin 'type'/'organizer',
// die de scraper altijd als gok/placeholder resp. altijd leeg aanlevert.
const FILLABLE_FIELDS = [
  'name_nl', 'city', 'province', 'distances',
  'registration_url', 'source_url', 'image', 'editie',
]

function isEmpty(value) {
  return value === null || value === undefined || value === ''
}

function computeFillableFields(existingRow, candidateRow) {
  const fillable = {}
  for (const field of FILLABLE_FIELDS) {
    if (isEmpty(existingRow[field]) && !isEmpty(candidateRow[field])) {
      fillable[field] = candidateRow[field]
    }
  }
  return fillable
}

export function dedupeAgainstDb(events, existingRows) {
  const existingBySerieDate = new Map()
  for (const row of existingRows) {
    if (!row.serie || !row.date) continue
    existingBySerieDate.set(`${row.serie}|${row.date}`, row)
  }

  const toInsert = []
  const toMerge = []
  const skipped = []

  for (const event of events) {
    const candidateRow = mapToSupabaseShape(event)
    const existing =
      candidateRow.serie && candidateRow.date
        ? existingBySerieDate.get(`${candidateRow.serie}|${candidateRow.date}`)
        : undefined

    if (!existing) {
      toInsert.push(event)
      continue
    }

    const fillable = computeFillableFields(existing, candidateRow)
    if (Object.keys(fillable).length > 0) {
      toMerge.push({ event, existingId: existing.id, fillable })
    } else {
      skipped.push(event)
    }
  }

  return { toInsert, toMerge, skipped }
}
