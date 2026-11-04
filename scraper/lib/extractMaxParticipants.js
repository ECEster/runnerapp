// Herkent het maximaal aantal deelnemers in de tekst van een inschrijfpagina,
// bv. "inschrijving stopt bij 500 deelnemers", "maximaal 1.000 lopers",
// "Maximaal aantal deelnemers: 750", "deelnemerslimiet van 300".
//
// Bewust voorzichtig: alleen een getal direct naast zo'n woordgroep, tussen
// 20 en 100.000. Noemt de pagina meerdere verschillende maxima (bv. per
// afstand), dan geven we niets terug: één getal tonen zou dan niet kloppen.

const N = String.raw`(\d{1,3}(?:[.\s]\d{3})+|\d{2,6})`
const WHO = String.raw`(?:deelnemers|lopers|hardlopers|starters|startbewijzen|startplaatsen|startnummers|inschrijvingen)`
const PATTERNS = [
  new RegExp(String.raw`(?:maximaal|maximum|max\.?)\s+(?:aantal\s+)?(?:van\s+)?${N}\s+${WHO}`, 'gi'),
  new RegExp(String.raw`(?:maximaal|maximum|max\.?)\s+aantal\s+${WHO}\s*(?:is|bedraagt|:)?\s*${N}`, 'gi'),
  new RegExp(String.raw`(?:stopt|sluit|vol)\s+bij\s+${N}\s+${WHO}`, 'gi'),
  new RegExp(String.raw`(?:deelnemers|inschrijf)limiet\s*(?:is|van|:)?\s*(?:op\s+)?${N}`, 'gi'),
  new RegExp(String.raw`(?:beperkt\s+tot|gelimiteerd\s+tot)\s+${N}\s+${WHO}`, 'gi'),
]
// Niet over deelnemers aan het evenement zelf
const NOT = /per\s+(?:team|groep|ploeg|school|vereniging|bedrijf)|teams?\b|vrijwilligers|bus|parkeer|vorig\s+jaar|record/i

function toNumber(s) {
  return parseInt(s.replace(/[.\s]/g, ''), 10)
}

export function extractMaxParticipants(text) {
  const found = new Map()
  for (const re of PATTERNS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      const around = text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30)
      if (NOT.test(around)) continue
      const n = toNumber(m[1])
      if (n >= 20 && n <= 100000 && !found.has(n)) found.set(n, text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 20).trim())
    }
  }
  if (found.size !== 1) return null
  const [[value, quote]] = [...found]
  return { value, quote }
}
