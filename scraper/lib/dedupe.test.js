// Draai met: node --test lib/dedupe.test.js  (of: node --test  om alle *.test.js te draaien)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dedupeEvents } from './dedupe.js'
import { namesLikelyMatch } from './nameSimilarity.js'

test('dedupeEvents: exacte plaats+datum match (bestaand gedrag blijft werken)', () => {
  const { unique, duplicates } = dedupeEvents([
    { naam: 'Woellust Run', datum: '2026-10-04', plaats: 'Woltersum' },
    { naam: 'Woellustrun', datum: '2026-10-04', plaats: 'Woltersum' },
  ])
  assert.equal(unique.length, 1)
  assert.equal(duplicates.length, 1)
})

test('dedupeEvents: vangt de "4 Mijl van Groningen"-situatie (plaats ontbreekt bij één bron, wijkt af bij de andere)', () => {
  const candidates = [
    { naam: '4 mijl 4 You Haren - Groningen', datum: '2026-10-11', plaats: null },
    { naam: 'De 4 mijl van Groningen', datum: '2026-10-11', plaats: null },
    { naam: '4 Mijl van Groningen', datum: '2026-10-11', plaats: 'Haren' },
  ]
  const { unique, duplicates } = dedupeEvents(candidates)
  assert.equal(unique.length, 1, `verwachtte 1 uniek event, kreeg ${unique.length}: ${unique.map((e) => e.naam)}`)
  assert.equal(duplicates.length, 2)
})

test('dedupeEvents: laat verschillende evenementen met vergelijkbare naam op andere datums met rust', () => {
  const { unique, duplicates } = dedupeEvents([
    { naam: '4 Mijl van Groningen', datum: '2026-10-11', plaats: 'Haren' },
    { naam: '4 Mijl van AvK', datum: '2027-04-10', plaats: 'Annerveenschekanaal' },
    { naam: '4 mijl van Assen', datum: '2026-09-19', plaats: null },
  ])
  assert.equal(unique.length, 3)
  assert.equal(duplicates.length, 0)
})

test('dedupeEvents: voegt generieke, gelijknamige events op dezelfde dag NIET zomaar samen', () => {
  // Twee totaal verschillende lopen die toevallig allebei "5 km Loop" heten
  // en op dezelfde dag vallen, maar in andere plaatsen — geen gedeeld
  // onderscheidend (niet-generiek) woord, dus moeten apart blijven staan.
  const { unique, duplicates } = dedupeEvents([
    { naam: '5 km Loop Stadskanaal', datum: '2026-11-01', plaats: 'Stadskanaal' },
    { naam: '5 km Loop Winschoten', datum: '2026-11-01', plaats: 'Winschoten' },
  ])
  assert.equal(unique.length, 2)
  assert.equal(duplicates.length, 0)
})

test('namesLikelyMatch: plaatsnaam in de titel telt als onderscheidend gedeeld woord', () => {
  assert.equal(
    namesLikelyMatch('4 mijl 4 You Haren - Groningen', '4 Mijl van Groningen'),
    true,
  )
})

test('namesLikelyMatch: kaal gedeeld "4 mijl" is NIET genoeg zonder plaatsnaam of ander onderscheidend woord (bewuste terughoudendheid)', () => {
  // "Menzis 4 Mijl & Kids 4 Mijl" deelt alleen de generieke woorden "4" en
  // "mijl" met "4 Mijl van Groningen" — geen plaatsnaam in de titel zelf.
  // Dit is een geaccepteerde beperking (zie lib/dedupeAgainstDb.js): beter een
  // overbodige concept-rij die de reviewer wegklikt dan een ten onrechte
  // samengevoegd (en dus stilletjes gemist) evenement.
  assert.equal(
    namesLikelyMatch('Menzis 4 Mijl & Kids 4 Mijl', '4 Mijl van Groningen'),
    false,
  )
})

test('namesLikelyMatch: geen match zonder enig gedeeld woord', () => {
  assert.equal(namesLikelyMatch('Woellust Run', 'Stadsloop Appingedam'), false)
})

test('namesLikelyMatch: "Kleintje X" is een apart evenement naast "X", geen duplicaat', () => {
  // Ontdekt tijdens het testen tegen echte data: zonder deze check werd
  // "Kleintje Berenloop" (vermoedelijk de kortere/jeugdversie) ten onrechte
  // samengevoegd met "Berenloop Terschelling" puur omdat ze het woord
  // "berenloop" delen.
  assert.equal(namesLikelyMatch('Berenloop Terschelling', 'Kleintje Berenloop'), false)
})

// dedupeAgainstDb (matching tegen de database) gebruikt sinds de invoering
// van 'serie' geen fuzzy naam/plaats-matching meer, maar (serie, date) — zie
// lib/dedupeAgainstDb.test.js.
