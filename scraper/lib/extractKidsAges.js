// Haalt de leeftijden van de kidsrun/jeugdonderdelen uit de tekst van een
// inschrijfpagina, voor het leeftijdsfilter op de site.
//
// Alleen leeftijden vlak bij een kids-/jeugdwoord tellen (anders pakken we
// "vanaf 16 jaar" van de 10 km). Herkent:
//   "4 t/m 7 jaar", "8-11 jaar", "8 tot 12 jaar"  -> 4..7, 8..11
//   "t/m 12 jaar", "tot en met 12 jaar"           -> ..12
//   "vanaf 6 jaar", "6 jaar en ouder"             -> 6..
//   "U8", "U12" (atletiekcategorie: onder de 8)   -> ..7
//   "geboren in 2015 of later"                    -> ..(eventjaar - 2015)
//   "geboren 2012 t/m 2016" / "2012-2016"         -> (jaar-2016)..(jaar-2012)
// Uitkomst: { min, max, quote } over alle kidsonderdelen samen (jongste
// ondergrens, oudste bovengrens), of null. Leeftijden buiten 2..18 vallen af.

const KIDS = /kids|kinder|jeugd|mini|pupil|junior|bambino|guppie|kabouter|kleuter|scholier|basisschool|groep\s?[1-8]\b|\bU\d{1,2}\b/gi
const WINDOW = 120

function clampAge(n) {
  return Number.isInteger(n) && n >= 2 && n <= 18 ? n : null
}

function rangesIn(snippet, eventYear) {
  const out = []
  const push = (a, b) => {
    const lo = a === null ? null : clampAge(a)
    const hi = b === null ? null : clampAge(b)
    if ((a !== null && lo === null) || (b !== null && hi === null)) return
    if (lo !== null && hi !== null && lo > hi) return
    if (lo !== null || hi !== null) out.push([lo, hi])
  }
  let m
  // geboortejaren eerst (anders lijkt "2012-2016" op niets, of op leeftijden)
  const born = /geboren\s+(?:in\s+|vanaf\s+|na\s+|tussen\s+)?(20[01]\d)\s*(?:-|t\/m|tot\s+en\s+met|en)\s*(20[01]\d)|geboren\s+(?:in\s+)?(20[01]\d)\s+(?:of|en)\s+(?:later|jonger)|geboren\s+(?:in\s+)?(20[01]\d)\s+(?:of|en)\s+(?:eerder|ouder)/gi
  while ((m = born.exec(snippet))) {
    if (m[1]) push(eventYear - Math.max(+m[1], +m[2]), eventYear - Math.min(+m[1], +m[2]))
    else if (m[3]) push(null, eventYear - +m[3])
    else if (m[4]) push(eventYear - +m[4], null)
  }
  const range = /\b(\d{1,2})\s*(?:-|–|t\/m|tot\s+en\s+met|tot)\s*(\d{1,2})\s*(?:jaar|jr)/gi
  while ((m = range.exec(snippet))) push(+m[1], +m[2])
  const upto = /(?<!\d\s*(?:-|–)\s*)(?<!\d\s)(?:t\/m|tot\s+en\s+met|tot|max(?:imaal)?\.?|onder\s+de)\s*(\d{1,2})\s*(?:jaar|jr)/gi
  while ((m = upto.exec(snippet))) push(null, /onder\s+de/i.test(m[0]) ? +m[1] - 1 : +m[1])
  const from = /(?:vanaf|v\.a\.)\s*(\d{1,2})\s*(?:jaar|jr)|\b(\d{1,2})\s*(?:jaar|jr)\s+(?:en\s+ouder|of\s+ouder)/gi
  // "vanaf 16 jaar" hoort bij de volwassenenloop: alleen ondergrenzen t/m 12 jaar
  while ((m = from.exec(snippet))) if (+(m[1] || m[2]) <= 12) push(+(m[1] || m[2]), null)
  const u = /\bU(\d{1,2})\b/g
  while ((m = u.exec(snippet))) push(null, +m[1] - 1)
  return out
}

export function extractKidsAges(text, eventYear) {
  const ranges = []
  let quote = null
  let m
  KIDS.lastIndex = 0
  const seen = new Set()
  while ((m = KIDS.exec(text))) {
    const start = Math.max(0, m.index - 30)
    const snippet = text.slice(start, m.index + m[0].length + WINDOW)
    const found = rangesIn(snippet, eventYear)
    for (const r of found) {
      const key = r.join('|')
      if (seen.has(key)) continue
      seen.add(key)
      ranges.push(r)
      if (!quote) quote = snippet.trim().slice(0, 200)
    }
  }
  if (!ranges.length) return null
  const lows = ranges.map((r) => r[0]).filter((v) => v !== null)
  const highs = ranges.map((r) => r[1]).filter((v) => v !== null)
  const min = lows.length ? Math.min(...lows) : null
  const max = highs.length ? Math.max(...highs) : null
  if (min !== null && max !== null && min > max) return null
  return { min, max, quote }
}
