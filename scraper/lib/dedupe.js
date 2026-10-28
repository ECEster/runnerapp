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

// Uitzondering op datum+plaats: twee namen die elk een ánder soort loop aanduiden
// zijn geen dubbel, ook al vallen ze op dezelfde dag in dezelfde plaats. Bv.
// "Zevenheuvelennacht" naast "Zevenheuvelenloop" (Nijmegen, 14 nov), of een
// kidsrun naast de hoofdloop. Woorden als deel van een samenstelling tellen mee
// ("Zevenheuvelennacht" bevat "nacht").
const DISTINGUISHING_WORDS = ['nacht', 'night', 'kids', 'kinder', 'jeugd', 'junior', 'trail', 'estafette', 'relay', 'wandel', 'walk']

function distinguishingWords(name) {
  const n = normalize(name)
  return DISTINGUISHING_WORDS.filter((w) => n.includes(w)).sort().join(',')
}

export function namesClearlyDifferent(nameA, nameB) {
  return distinguishingWords(nameA) !== distinguishingWords(nameB)
}

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
  const byKey = new Map() // sleutel -> lijst van behouden events
  const duplicates = []

  for (const event of events) {
    const key = keyFor(event)
    const kept = byKey.get(key) || []
    const same = kept.find((k) => !namesClearlyDifferent(k.naam, event.naam))
    if (same) {
      duplicates.push({ kept: same, removed: event })
      continue
    }
    kept.push(event)
    byKey.set(key, kept)
  }

  const unique = []
  for (const event of [...byKey.values()].flat()) {
    const fuzzyMatch = unique.find(
      (kept) =>
        kept.datum === event.datum &&
        namesLikelyMatch(kept.naam, event.naam) &&
        !namesClearlyDifferent(kept.naam, event.naam),
    )
    if (fuzzyMatch) {
      duplicates.push({ kept: fuzzyMatch, removed: event })
      continue
    }
    unique.push(event)
  }

  return { unique, duplicates }
}
