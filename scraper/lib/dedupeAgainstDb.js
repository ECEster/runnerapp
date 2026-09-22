// Filtert events eruit die al in de database staan, vóórdat we ook maar overwegen
// iets te schrijven. Zelfde matchlogica als lib/dedupe.js (datum+plaats primair,
// naam+datum als plaats onbekend is, plus dezelfde datum + sterk overeenkomende
// naam als tweede, voorzichtigere ronde — zie lib/nameSimilarity.js) — bewust
// consistent gehouden, anders zouden we events die op de twee bronnen anders
// geschreven staan (bv. "Woellust Run" vs. "Woellustrun") telkens opnieuw als
// "nieuw" behandelen bij elke volgende run.
//
// Bekende beperking: de fuzzy naam-check vergelijkt hier alleen tegen name_nl
// van bestaande rijen. Een handmatig/officieel toegevoegd evenement met een
// sponsornaam die niets met de geschraapte naam deelt (bv. "Menzis 4 Mijl &
// Kids 4 Mijl" vs. "4 Mijl van Groningen" — geen gedeeld, niet-generiek woord)
// wordt daardoor niet automatisch herkend. Dat geeft in het ergste geval een
// extra concept-rij naast een al gepubliceerd evenement, geen dataverlies —
// de reviewer ziet en verwijdert 'm gewoon in het admin-paneel.
import { normalize } from './dedupe.js'
import { namesLikelyMatch } from './nameSimilarity.js'

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
      continue
    }
    const fuzzyMatch = existingRows.some(
      (row) => row.date === event.datum && namesLikelyMatch(row.name_nl, event.naam),
    )
    if (fuzzyMatch) {
      alreadyExists.push(event)
      continue
    }
    toInsert.push(event)
  }

  return { toInsert, alreadyExists }
}
