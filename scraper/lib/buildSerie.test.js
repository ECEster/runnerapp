// Draai met: node --test lib/buildSerie.test.js  (of: node --test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSerie } from './buildSerie.js'

test('buildSerie: "De ... 2026" en de kale naam leveren dezelfde serie op', () => {
  const a = buildSerie({ naam: 'De 4 Mijl van Groningen 2026', plaats: null })
  const b = buildSerie({ naam: '4 Mijl Groningen', plaats: null })
  assert.equal(a, b)
  assert.equal(a, '4-mijl-groningen')
})

test('buildSerie: plaats die al in de naam zit wordt niet gedupliceerd', () => {
  const serie = buildSerie({ naam: '4 Mijl van Groningen', plaats: 'Groningen' })
  assert.equal(serie, '4-mijl-groningen')
})

test('buildSerie: plaats die nog niet in de naam zit wordt toegevoegd', () => {
  const serie = buildSerie({ naam: 'Bosloop', plaats: 'Assen' })
  assert.equal(serie, 'bosloop-assen')
})

test('buildSerie: leidend rangtelwoord wordt genegeerd', () => {
  const a = buildSerie({ naam: '22ste Proostmeerloop', plaats: 'Wagenborgen' })
  const b = buildSerie({ naam: 'Proostmeerloop', plaats: 'Wagenborgen' })
  assert.equal(a, b)
  assert.equal(a, 'proostmeerloop-wagenborgen')
})

test('buildSerie: diakrieten en hoofdletters worden genormaliseerd', () => {
  assert.equal(buildSerie({ naam: 'Zévenheuvelenloop', plaats: null }), 'zevenheuvelenloop')
})

test('buildSerie: leestekens worden verwijderd', () => {
  assert.equal(buildSerie({ naam: "Woellust-Run!", plaats: null }), 'woellust-run')
})

test('buildSerie: geen naam geeft null', () => {
  assert.equal(buildSerie({ naam: null, plaats: 'Groningen' }), null)
  assert.equal(buildSerie({ naam: '', plaats: 'Groningen' }), null)
})
