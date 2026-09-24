// Draai met: node --test lib/parseLoopjeLoopje.test.js
//
// Test alleen parseLoopjeLoopjeRows() — de zuivere, synchrone rij-parsing
// (geen netwerk). parseLoopjeLoopjeEvents() erbovenop doet ook nog de
// provincie-opzoeking via PDOK (lib/resolveProvince.js) en wordt daarom
// handmatig gecontroleerd met een live dry-run i.p.v. hier getest — zie
// README.md.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseLoopjeLoopjeRows } from './parseLoopjeLoopje.js'

// Echte rij-structuur van loopjeloopje.nl (2026-09-22), verkort tot 3 rijen.
const SAMPLE_HTML = `
<table>
  <tbody>
    <tr>
        <td>
          <a href="https://www.loopcircuitdekopvandrenthe.nl/programma/zeijer_strubbenloop.php" target="_blank" class="">Zeijer Strubbenloop</a>
        </td>
        <td>08 nov 2026 - 13:15</td>
        <td><a href="https://www.google.nl/maps/place/ZEIJEN/" target="_blank" class="btn-sm"><i class="bi bi-geo-alt text-primary"></i></a> ZEIJEN</td>
        <td> 0,5KM <span style="color: #1e87f0;"><strong>|</strong></span>  1KM <span style="color: #1e87f0;"><strong>|</strong></span>  5KM</td>
    </tr>
    <tr>
        <td>
          <a href="https://www.deur-donderen.nl" target="_blank" class="">Martijn Mijlpaal Marathon (max. 20 deelnemers)</a>
        </td>
        <td>14 nov 2026 - 09:00</td>
        <td><a href="https://www.google.nl/maps/place/NIEUW RODEN/" target="_blank" class="btn-sm"><i class="bi bi-geo-alt text-primary"></i></a> NIEUW RODEN</td>
        <td> 4,2KM <span style="color: #1e87f0;"><strong>|</strong></span>  21,1KM <span style="color: #1e87f0;"><strong>|</strong></span>  42,2KM</td>
    </tr>
    <tr>
        <td>
          <a href="https://svfriesland.nl/evenementen/marderhoekloop-informatie/" target="_blank" class="">Marderhoekloop</a>
        </td>
        <td>14 nov 2026 - 11:00</td>
        <td><a href="https://www.google.nl/maps/place/OUDEMIRDUM/" target="_blank" class="btn-sm"><i class="bi bi-geo-alt text-primary"></i></a> OUDEMIRDUM</td>
        <td> 5KM <span style="color: #1e87f0;"><strong>|</strong></span>  10KM</td>
    </tr>
  </tbody>
</table>
`

test('parseLoopjeLoopjeRows: haalt naam, datum, plaats, afstanden en url uit elke rij', () => {
  const events = parseLoopjeLoopjeRows(SAMPLE_HTML)
  assert.equal(events.length, 3)
  assert.deepEqual(events[0], {
    naam: 'Zeijer Strubbenloop',
    naam_ruw: 'Zeijer Strubbenloop',
    datum: '2026-11-08',
    plaats: 'ZEIJEN',
    afstanden: ['0,5KM', '1KM', '5KM'],
    organisator_url: 'https://www.loopcircuitdekopvandrenthe.nl/programma/zeijer_strubbenloop.php',
    bron_url: 'https://www.loopjeloopje.nl/',
    afbeelding_url: null,
  })
})

test('parseLoopjeLoopjeRows: laat een sponsor-/deelnemerslimiet-toevoeging in de naam intact', () => {
  const events = parseLoopjeLoopjeRows(SAMPLE_HTML)
  assert.equal(events[1].naam, 'Martijn Mijlpaal Marathon (max. 20 deelnemers)')
  assert.equal(events[1].plaats, 'NIEUW RODEN')
  assert.equal(events[1].datum, '2026-11-14')
})

test('parseLoopjeLoopjeRows: negeert rijen zonder de verwachte 4 cellen', () => {
  const events = parseLoopjeLoopjeRows('<tr><td>Kapotte rij</td></tr>')
  assert.equal(events.length, 0)
})

test('parseLoopjeLoopjeRows: geeft een lege lijst bij geen enkele rij', () => {
  const events = parseLoopjeLoopjeRows('<div>Geen tabel hier</div>')
  assert.equal(events.length, 0)
})
