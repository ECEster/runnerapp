// Draai met: node --test lib/decodeHtmlEntities.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeHtmlEntities } from './decodeHtmlEntities.js'

test('decodeHtmlEntities: herstelt &amp; in een link (Oudejaarsloop Blijham)', () => {
  assert.equal(
    decodeHtmlEntities('https://www.avaquilo.nl/index.php?page=Ev_Oudejaarsloop_&amp;sid=1'),
    'https://www.avaquilo.nl/index.php?page=Ev_Oudejaarsloop_&sid=1',
  )
})

test('decodeHtmlEntities: meerdere en numerieke entiteiten', () => {
  assert.equal(decodeHtmlEntities('a=1&amp;b=2&#38;c=3&#x26;d=4'), 'a=1&b=2&c=3&d=4')
})

test('decodeHtmlEntities: laat gewone tekst en onbekende entiteiten ongemoeid', () => {
  assert.equal(decodeHtmlEntities('https://voorbeeld.nl/?a=1&b=2'), 'https://voorbeeld.nl/?a=1&b=2')
  assert.equal(decodeHtmlEntities('Run &foo; Walk'), 'Run &foo; Walk')
})

test('decodeHtmlEntities: null blijft null', () => {
  assert.equal(decodeHtmlEntities(null), null)
})
