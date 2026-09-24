// Draai met: node --test lib/extractEditie.test.js  (of: node --test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractEditie } from './extractEditie.js'

test('extractEditie: "ste"-rangtelwoord', () => {
  assert.equal(extractEditie({ rawNaam: '22ste Proostmeerloop', datum: '2026-09-05' }), 22)
})

test('extractEditie: "de"-rangtelwoord', () => {
  assert.equal(extractEditie({ rawNaam: '12de Woellust Run', datum: '2026-10-04' }), 12)
})

test('extractEditie: "e"-rangtelwoord', () => {
  assert.equal(extractEditie({ rawNaam: '42e Marathon Rotterdam', datum: '2026-04-12' }), 42)
})

test('extractEditie: "sinds JJJJ" berekent editienummer op basis van datum', () => {
  assert.equal(extractEditie({ rawNaam: 'Berenloop, sinds 1983', datum: '2026-08-15' }), 44)
})

test('extractEditie: "sinds JJJJ" zonder datum geeft null', () => {
  assert.equal(extractEditie({ rawNaam: 'Berenloop, sinds 1983', datum: null }), null)
})

test('extractEditie: geen signaal geeft null (nooit gokken)', () => {
  assert.equal(extractEditie({ rawNaam: '4 Mijl van Groningen', datum: '2026-10-11' }), null)
})

test('extractEditie: geen ruwe naam geeft null', () => {
  assert.equal(extractEditie({ rawNaam: null, datum: '2026-10-11' }), null)
})

test('extractEditie: getal gevolgd door afstandseenheid is geen rangtelwoord', () => {
  assert.equal(extractEditie({ rawNaam: '10 km Bosloop', datum: '2026-10-11' }), null)
})
