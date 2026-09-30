// Draai met: node --test lib/detectSurvivalrun.test.js  (of: node --test)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectSurvivalrun } from './detectSurvivalrun.js'

test('detectSurvivalrun: herkent "ObstacleRun" in de naam', () => {
  assert.equal(detectSurvivalrun({ naam: 'IntersportObstacleRun' }), true)
})

test('detectSurvivalrun: herkent "obstakel" (NL-schrijfwijze)', () => {
  assert.equal(detectSurvivalrun({ naam: 'ObstakelRun KardingeRun' }), true)
})

test('detectSurvivalrun: herkent "survival", ongevoelig voor hoofdletters', () => {
  assert.equal(detectSurvivalrun({ naam: 'SURVIVAL RUN DRENTHE' }), true)
})

test('detectSurvivalrun: herkent OCR/Spartan/Tough Mudder/bootcamp', () => {
  assert.equal(detectSurvivalrun({ naam: 'Spartan Race NL' }), true)
  assert.equal(detectSurvivalrun({ naam: 'Tough Mudder Netherlands' }), true)
  assert.equal(detectSurvivalrun({ naam: 'OCR Series Assen' }), true)
  assert.equal(detectSurvivalrun({ naam: 'Bootcamp Challenge' }), true)
})

test('detectSurvivalrun: false zonder herkenbaar signaal (bekende beperking)', () => {
  assert.equal(detectSurvivalrun({ naam: 'Woellust Run' }), false)
})

test('detectSurvivalrun: geen naam geeft false', () => {
  assert.equal(detectSurvivalrun({ naam: null }), false)
  assert.equal(detectSurvivalrun({}), false)
})
