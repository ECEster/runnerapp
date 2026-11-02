// Draai met: node --test lib/parseInschrijven.test.js
// Voorbeelden van inschrijven.nl (november 2026).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseDatum, parseInschrijvenList, onderdeelToAfstand, parseAfstanden, selectCandidates } from './parseInschrijven.js'

test('parseDatum: "7 NOV 2026" en "13 MRT 2027"', () => {
  assert.equal(parseDatum('7 NOV 2026'), '2026-11-07')
  assert.equal(parseDatum('13 MRT 2027'), '2027-03-13')
  assert.equal(parseDatum('onbekend'), null)
})

test('parseInschrijvenList: leest de JSON-lijst uit de pagina', () => {
  const html = '<script>const events=[{"id":"2026110713263","nm":"Vestingstadrun","pl":"Sleeuwijk","ln":"NED","wd":"zaterdag","dt":"7 NOV 2026"}];(function(){})()</script>'
  assert.deepEqual(parseInschrijvenList(html), [
    { id: '2026110713263', nm: 'Vestingstadrun', pl: 'Sleeuwijk', ln: 'NED', wd: 'zaterdag', dt: '7 NOV 2026' },
  ])
  assert.deepEqual(parseInschrijvenList('<html>geen lijst</html>'), [])
})

test('selectCandidates: alleen Nederland, echte plaats, geen competities', () => {
  const ev = (nm, pl, ln = 'NED') => ({ id: '1', nm, pl, ln, dt: '7 NOV 2026' })
  const kept = selectCandidates([
    ev('Vestingstadrun', 'Sleeuwijk'),
    ev('Feesteloop', 'Avelgem', 'BEL'),
    ev('De AERS Groep Zeeuwse Crosscompetitie', 'Zeeland'),
    ev('Veluwse Winter Competitie', 'Meerdere plaatsen'),
    ev('ATB Top Noord-Holland', 'Diverse locaties'),
    ev('Zorg en Zekerheid Circuit', 'Leiden'),
    ev('Zorg en Zekerheid Circuit 1 loop', 'Leiden'),
  ]).map((e) => e.nm)
  assert.deepEqual(kept, ['Vestingstadrun', 'Zorg en Zekerheid Circuit 1 loop'])
})

test('onderdeelToAfstand: km, meters, marathons', () => {
  assert.equal(onderdeelToAfstand('10.5 km'), '10.5 km')
  assert.equal(onderdeelToAfstand('21.1 km wedstrijd'), '21.1 km')
  assert.equal(onderdeelToAfstand('10 Kilometer'), '10 km')
  assert.equal(onderdeelToAfstand('6 km trail'), '6 km')
  assert.equal(onderdeelToAfstand('Halve Marathon'), '21.1 km')
  assert.equal(onderdeelToAfstand('1/2 marathon start Amersfoort 09:00 uur'), '21.1 km')
  assert.equal(onderdeelToAfstand('Marathon start 09:00 uur in Amersfoort'), '42.2 km')
  assert.equal(onderdeelToAfstand('500M'), '0.5 km')
  assert.equal(onderdeelToAfstand('Vissers Energy Group 5 kilometer'), '5 km')
})

test('onderdeelToAfstand: jeugd en kids worden Kidsrun', () => {
  assert.equal(onderdeelToAfstand('Kidsrun (1Km)'), 'Kidsrun 1 km')
  assert.equal(onderdeelToAfstand('Jeugd 4 t/m 6 jaar 800 m (09:35 uur)'), 'Kidsrun 0.8 km')
  assert.equal(onderdeelToAfstand('Jeugd 8-9 jr'), 'Kidsrun')
  assert.equal(onderdeelToAfstand('2.7 km jeugdloop'), 'Kidsrun 2.7 km')
})

test('onderdeelToAfstand: zonder afstand -> null', () => {
  assert.equal(onderdeelToAfstand('Lange Cross'), null)
  assert.equal(onderdeelToAfstand('Recreanten 2 rondes M+V 16 t/m 99'), null)
  assert.equal(onderdeelToAfstand('Mannen U18'), null)
})

test('parseAfstanden: uniek en van kort naar lang', () => {
  const html = '<select><option value="">&nbsp;</option><option value="1">Halve Marathon</option><option value="2">10.5 km</option><option value="3">5 km</option><option value="4">Kidsrun</option><option value="5">5 km recreanten</option></select>'
  assert.deepEqual(parseAfstanden(html), ['Kidsrun', '5 km', '10.5 km', '21.1 km'])
})
