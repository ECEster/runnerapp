// Draai met: node --test lib/extractPrice.test.js
// De teksten komen van echte organisatorsites (november 2026).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractPrice, extractPriceFromText, findPriceLinks } from './extractPrice.js'

test('extractPrice: één bedrag na "Inschrijfkosten"', () => {
  const r = extractPriceFromText('gepubliceerd op uitslagen.nl Inschrijfkosten : € 5,-. Inschrijven vanaf 18.00 uur in de kantine')
  assert.equal(r.price, '5')
  assert.match(r.quote, /^Inschrijfkosten : € 5,-/)
})

test('extractPrice: bereik over meerdere afstanden, met komma-decimalen', () => {
  const r = extractPriceFromText('Inschrijven voor 2027 Inschrijfgeld 5 km: €10,00 10 km: €16,50 25 km: €19,50 Natuurlijk')
  assert.equal(r.price, '10 - 19,50')
})

test('extractPrice: "8 EURO" achter het getal', () => {
  assert.equal(extractPriceFromText('Kantine FC Axel Inschrijfgeld: 8 EURO Kleed/douchelocatie').price, '8')
})

test('extractPrice: medaille telt niet mee', () => {
  const r = extractPriceFromText('Start om 19.30 uur Kosten Kinderen t/m 16 jaar € 3,00; Volwassenen € 6,00; Medaille €3,00')
  assert.equal(r.price, '3 - 6')
})

test('extractPrice: teambedrag telt niet mee', () => {
  const r = extractPriceFromText('Inschrijfgeld 5 km € 8,00. Bedrijven kunnen zich aanmelden voor de competitie. Kosten zijn € 75,00 per team.')
  assert.equal(r.price, '8')
})

test('extractPrice: korting en prijzengeld tellen niet mee', () => {
  assert.equal(extractPriceFromText('Inschrijfgeld € 12,50. Leden krijgen € 2,50 korting.').price, '12,50')
  assert.equal(extractPriceFromText('Er is prijzengeld: € 100 voor de winnaar'), null)
})

test('extractPrice: bedrijvenloop en prijzen voor de winnaars tellen niet mee', () => {
  assert.equal(extractPriceFromText('Tarieven: 10 km (€ 10,00) | 5 km (€ 9,00) | Bedrijvenloop (€ 75,00).').price, '9 - 10')
  assert.equal(extractPriceFromText('Prijzen senioren 1ste € 25,- 2de € 15,- 3de € 10,- Wisselbeker'), null)
})

test('extractPrice: bedrag zonder sleutelwoord ervoor telt niet', () => {
  assert.equal(extractPriceFromText('Kom ook naar onze kantine, een kop koffie kost € 2,00'), null)
})

test('extractPrice: geen bedrag -> null', () => {
  assert.equal(extractPrice('<html><body><p>Inschrijven via de link hieronder.</p></body></html>'), null)
})

test('extractPrice: leest door HTML-tags en &euro; heen', () => {
  const html = '<table><tr><th>Tarieven</th></tr><tr><td>5 km</td><td>&euro;&nbsp;7,50</td></tr><tr><td>10 km</td><td>&euro; 10,-</td></tr></table>'
  assert.equal(extractPrice(html).price, '7,50 - 10')
})

test('extractPrice: geen bedrag uit een groot getal als € 5.000', () => {
  assert.equal(extractPriceFromText('Inschrijving: totaal € 5.000 opgehaald voor het goede doel'), null)
})

test('findPriceLinks: alleen links op dezelfde site met een prijsachtig woord', () => {
  const html = '<a href="/inschrijven">Inschrijven</a><a href="/nieuws">Nieuws</a><a href="https://facebook.com/x">Info</a><a href="tarieven.html">Kosten</a>'
  assert.deepEqual(findPriceLinks(html, 'https://loop.nl/'), ['https://loop.nl/inschrijven', 'https://loop.nl/tarieven.html'])
})
