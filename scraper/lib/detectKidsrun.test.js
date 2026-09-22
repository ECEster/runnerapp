// Draai met: node --test lib/detectKidsrun.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectKidsrun } from './detectKidsrun.js'

test('detectKidsrun: herkent "Kids" in de naam', () => {
  assert.equal(
    detectKidsrun({ naam: 'Menzis 4 Mijl & Kids 4 Mijl', afstanden: ['4 mi'] }),
    true,
  )
})

test('detectKidsrun: herkent een aparte kidsrun-afstand', () => {
  assert.equal(
    detectKidsrun({ naam: 'Stadsloop Appingedam', afstanden: ['0.1 km', 'Kidsrun 0.4 km', '5 km'] }),
    true,
  )
})

test('detectKidsrun: false als er niets op wijst (bekende beperking, bv. Kûbaarder Hurdrindei)', () => {
  // runphy.nl noemt voor dit evenement alleen "5 km, 10.2 km, 21.1 km" — geen
  // enkel signaal dat er ook een kidsrun is, terwijl die er in werkelijkheid
  // wel is (staat wel op de organisator-eigen site, die we niet bezoeken).
  assert.equal(
    detectKidsrun({ naam: 'Kûbaarder Hurdrindei', afstanden: ['5 km', '10.2 km', '21.1 km'] }),
    false,
  )
})

test('detectKidsrun: negeert het geval-ongevoelig', () => {
  assert.equal(detectKidsrun({ naam: 'JEUGDLOOP Foo', afstanden: [] }), true)
})
