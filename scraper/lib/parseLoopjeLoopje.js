// Parser voor loopjeloopje.nl.
//
// Anders dan runphy.nl en hardloopkalendernederland.nl heeft deze bron geen
// aparte pagina per provincie — het is één landelijke lijst, netjes in een
// HTML-<table> (naam, datum+tijd, plaats als Google Maps-link, afstanden).
// Omdat lib/collectEvents.js alleen Noord-Nederland verzamelt, filteren we
// hier zelf op provincie via lib/resolveProvince.js (PDOK Locatieserver,
// zie dat bestand voor waarom).

import { resolveProvince } from './resolveProvince.js'

const MONTHS_NL = {
  jan: 1, feb: 2, mrt: 3, apr: 4, mei: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12,
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// "25 sep 2026 - 17:00" -> "2026-09-25"
function parseDatum(datumTijdText) {
  const m = datumTijdText.match(/(\d{1,2}) (\w{3}) (\d{4})/)
  if (!m) return null
  const maand = MONTHS_NL[m[2].toLowerCase()]
  if (!maand) return null
  return `${m[3]}-${String(maand).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`
}

function parseRow(rowHtml) {
  const tds = rowHtml.match(/<td>([\s\S]*?)<\/td>/g) ?? []
  if (tds.length < 4) return null
  const [naamCell, datumCell, plaatsCell, afstandenCell] = tds

  const naamMatch = naamCell.match(/<a[^>]*>([^<]*)<\/a>/)
  const urlMatch = naamCell.match(/href="([^"]*)"/)

  // De plaats staat als Google Maps-link: .../maps/place/PLAATSNAAM
  const plaatsMatch = plaatsCell.match(/place\/([^"]*)"/)
  let plaats = plaatsMatch ? decodeURIComponent(plaatsMatch[1]).trim() : stripTags(plaatsCell)
  plaats = plaats.replace(/\/$/, '').trim()

  const afstanden = stripTags(afstandenCell)
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)

  const naam = naamMatch ? naamMatch[1].trim() : stripTags(naamCell) || null
  return {
    naam,
    // Ongewijzigd t.o.v. 'naam' — deze bron strip geen rangtelwoord-prefix,
    // dus 'naam' bevat al de ruwe tekst (zie lib/extractEditie.js).
    naam_ruw: naam,
    datum: parseDatum(stripTags(datumCell)),
    plaats: plaats || null,
    afstanden,
    organisator_url: urlMatch ? urlMatch[1].trim() : null,
    bron_url: 'https://www.loopjeloopje.nl/',
    afbeelding_url: null,
  }
}

export function parseLoopjeLoopjeRows(html) {
  const rows = html.match(/<tr>\s*<td>.*?<\/tr>/gs) ?? []
  return rows.map(parseRow).filter((event) => event !== null)
}

// Haalt en parset alle rijen, en houdt alleen evenementen over waarvan de
// plaats (via PDOK) in Groningen, Friesland of Drenthe ligt. Async omdat
// resolveProvince() een netwerkopvraging kan zijn (met cache).
export async function parseLoopjeLoopjeEvents(html) {
  const candidates = parseLoopjeLoopjeRows(html)
  const result = []
  for (const event of candidates) {
    if (!event.plaats) continue
    const provincie = await resolveProvince(event.plaats)
    if (provincie === 'Groningen' || provincie === 'Friesland' || provincie === 'Drenthe') {
      result.push({ ...event, provincie })
    }
  }
  return result
}
