// Zet HTML-entiteiten in een tekst terug naar gewone tekens.
//
// Waarom: loopjeloopje.nl (en mogelijk andere bronnen) zet links in de HTML als
// href="...?page=x&amp;sid=1". Die '&amp;' is alleen de HTML-schrijfwijze van '&'
// — als we de ruwe tekst overnemen, werkt de link op onze site niet goed.
// We ondersteunen de gangbare benoemde entiteiten plus numerieke (&#38; / &#x26;).

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

export function decodeHtmlEntities(str) {
  if (!str) return str
  return str.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : entity
    }
    return NAMED[code.toLowerCase()] ?? entity
  })
}
