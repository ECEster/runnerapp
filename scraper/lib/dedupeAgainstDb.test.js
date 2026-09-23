// Draai met: node --test lib/dedupeAgainstDb.test.js  (of: node --test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dedupeAgainstDb } from './dedupeAgainstDb.js'

function candidate(overrides) {
  return {
    naam: '4 Mijl van Groningen',
    naam_ruw: '4 Mijl van Groningen',
    datum: '2026-10-11',
    // Bewust null, niet 'Haren': buildSerie({naam, plaats}) zou 'Haren' als
    // extra woord toevoegen (het staat niet al in de naam), en dan niet meer
    // matchen met de '4-mijl-groningen'-serie die deze tests als bestaande
    // rij gebruiken — zie lib/buildSerie.test.js voor die precieze afweging.
    plaats: null,
    provincie: 'Groningen',
    afstanden: [],
    organisator_url: null,
    bron_url: null,
    afbeelding_url: null,
    ...overrides,
  }
}

test('dedupeAgainstDb: nieuw event (andere serie+datum) gaat naar toInsert', () => {
  const existingRows = [
    { id: 1, serie: '4-mijl-groningen', date: '2026-10-11', name_nl: '4 Mijl van Groningen', city: 'Haren' },
  ]
  const { toInsert, toMerge, skipped } = dedupeAgainstDb(
    [candidate({ naam: 'Stadsloop Appingedam', naam_ruw: 'Stadsloop Appingedam', datum: '2026-10-03', plaats: 'Appingedam' })],
    existingRows,
  )
  assert.equal(toInsert.length, 1)
  assert.equal(toMerge.length, 0)
  assert.equal(skipped.length, 0)
})

test('dedupeAgainstDb: bestaande serie+datum met een leeg veld gaat naar toMerge en vult alleen dat veld', () => {
  const existingRows = [
    {
      id: 42, serie: '4-mijl-groningen', date: '2026-10-11', name_nl: '4 Mijl van Groningen',
      city: 'Haren', province: 'Groningen', registration_url: null,
    },
  ]
  const { toInsert, toMerge, skipped } = dedupeAgainstDb(
    [candidate({ organisator_url: 'https://voorbeeld.nl/inschrijven' })],
    existingRows,
  )
  assert.equal(toInsert.length, 0)
  assert.equal(skipped.length, 0)
  assert.equal(toMerge.length, 1)
  assert.equal(toMerge[0].existingId, 42)
  assert.deepEqual(toMerge[0].fillable, { registration_url: 'https://voorbeeld.nl/inschrijven' })
})

test('dedupeAgainstDb: overschrijft nooit een al ingevulde waarde, ook niet als de kandidaat afwijkt', () => {
  const existingRows = [
    {
      id: 42, serie: '4-mijl-groningen', date: '2026-10-11',
      name_nl: '4 Mijl van Groningen (handmatig gecorrigeerd)', city: 'Haren', province: 'Groningen', editie: 22,
    },
  ]
  // Kandidaat heeft geen editie-signaal (naam_ruw levert null op) en een
  // andere naam dan de handmatig gecorrigeerde — geen van beide mag de
  // bestaande, niet-lege waarden overschrijven.
  const { toMerge, skipped } = dedupeAgainstDb([candidate()], existingRows)
  assert.equal(toMerge.length, 0)
  assert.equal(skipped.length, 1)
})

test('dedupeAgainstDb: rijen zonder eigen serie (nog niet gebackfilled) worden niet herkend als match', () => {
  // Bewuste, gedocumenteerde beperking: zonder 'serie' op de bestaande rij
  // valt terug op "nieuw" i.p.v. een match — vandaar dat backfill-serie.js
  // moet draaien vóórdat hierop vertrouwd wordt.
  const existingRows = [{ id: 1, serie: null, date: '2026-10-11', name_nl: '4 Mijl van Groningen', city: 'Haren' }]
  const { toInsert } = dedupeAgainstDb([candidate()], existingRows)
  assert.equal(toInsert.length, 1)
})
