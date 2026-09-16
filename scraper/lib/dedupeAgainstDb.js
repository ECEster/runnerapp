// Filtert events eruit die al in de database staan, vóórdat we ook maar overwegen
// iets te schrijven. Zelfde matchlogica als lib/dedupe.js (datum+plaats primair,
// naam+datum als plaats onbekend is) — bewust consistent gehouden, anders zouden we
// events die op de twee bronnen anders geschreven staan (bv. "Woellust Run" vs.
// "Woellustrun") telkens opnieuw als "nieuw" behandelen bij elke volgende run.
import { normalize } from './dedupe.js'

function keyForExisting(row) {
  if (row.city) {
    return `loc|${normalize(row.city)}|${row.date ?? ''}`
  }
  return `naam|${normalize(row.name_nl)}|${row.date ?? ''}`
}

function keyForCandidate(event) {
  if (event.plaats) {
    return `loc|${normalize(event.plaats)}|${event.datum ?? ''}`
  }
  return `naam|${normalize(event.naam)}|${event.datum ?? ''}`
}

export function dedupeAgainstDb(events, existingRows) {
  const existingKeys = new Set(existingRows.map(keyForExisting))

  const toInsert = []
  const alreadyExists = []

  for (const event of events) {
    if (existingKeys.has(keyForCandidate(event))) {
      alreadyExists.push(event)
    } else {
      toInsert.push(event)
    }
  }

  return { toInsert, alreadyExists }
}
