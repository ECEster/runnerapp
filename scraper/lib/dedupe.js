// Dedupliceert primair op datum + plaats: als die combinatie hetzelfde is, gaan we ervan
// uit dat het dezelfde run is, ook als de naam op de twee bronnen anders geschreven staat
// (bv. runphy "Woellust Run" vs. hardloopkalendernederland "Woellustrun", of "KardingeRun"
// vs. "ObstakelRun KardingeRun"). Dat is een bewuste keuze: het is zeer onwaarschijnlijk dat
// twee VERSCHILLENDE hardloopevenementen op exact dezelfde dag in exact dezelfde plaats
// worden gehouden, dus datum+plaats is een sterker signaal dan de (inconsistent geschreven)
// naam.
//
// Alleen als 'plaats' ontbreekt (null) kunnen we niet op locatie matchen — dan valt de check
// terug op naam + datum (exacte match, na trim/lowercase/spatie-normalisatie).
//
// Tweede, voorzichtigere ronde (zie lib/nameSimilarity.js): events die niet op de exacte
// sleutel hierboven matchen, maar wél op dezelfde datum staan met een sterk overeenkomende
// naam, worden ook samengevoegd. Dit vangt het geval waarin de ene bron geen plaats geeft
// en de andere een andere/specifiekere plaats geeft voor dezelfde run — bv. "4 mijl 4 You
// Haren - Groningen" (plaats: onbekend) vs. "4 Mijl van Groningen" (plaats: "Haren"). Zonder
// deze ronde komen zulke gevallen als losse, ongemerkte duplicaten in de database terecht.

import { namesLikelyMatch } from './nameSimilarity.js'

export function normalize(value) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function keyFor(event) {
  if (event.plaats) {
    return `loc|${normalize(event.plaats)}|${event.datum ?? ''}`
  }
  return `naam|${normalize(event.naam)}|${event.datum ?? ''}`
}

export function dedupeEvents(events) {
  const byKey = new Map()
  const duplicates = []

  for (const event of events) {
    const key = keyFor(event)
    if (byKey.has(key)) {
      duplicates.push({ kept: byKey.get(key), removed: event })
      continue
    }
    byKey.set(key, event)
  }

  const unique = []
  for (const event of byKey.values()) {
    const fuzzyMatch = unique.find(
      (kept) => kept.datum === event.datum && namesLikelyMatch(kept.naam, event.naam),
    )
    if (fuzzyMatch) {
      duplicates.push({ kept: fuzzyMatch, removed: event })
      continue
    }
    unique.push(event)
  }

  return { unique, duplicates }
}
