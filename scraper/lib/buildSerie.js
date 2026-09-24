// buildSerie.js — bouwt een stabiele, genormaliseerde 'serie'-sleutel voor een
// evenement, zodat verschillende jaargangen van hetzelfde terugkerende
// evenement (en enigszins verschillend geschreven namen, tussen bronnen of
// jaren) zo veel mogelijk op dezelfde serie uitkomen.
//
// Stopwoorden: zelfde idee als lib/nameSimilarity.js (incl. "van") — zonder
// "van" te negeren zouden "De 4 Mijl van Groningen" en "4 Mijl Groningen"
// NIET op dezelfde serie uitkomen, en dat is precies het geval dat dit moet
// vangen.
//
// Plaats wordt alleen toegevoegd als die nog geen deel uitmaakt van de
// (genormaliseerde) naam — anders zou "4 Mijl van Groningen" + plaats
// "Groningen" op "4-mijl-van-groningen-groningen" uitkomen. Dat betekent ook
// dat twee jaargangen van eenzelfde, generiek genoemd evenement (bv.
// "Bosloop") een net andere serie kunnen krijgen als bronnen het onderling
// oneens zijn over de plaats (bekend probleem, zie lib/nameSimilarity.js) —
// een gemiste match geeft hooguit een extra concept-rij, geen dataverlies.

const YEAR_RE = /\b(19|20)\d{2}\b/g
const ORDINAL_RE = /\b\d{1,3}(?:e|de|ste)\b/gi
const STOPWORDS = new Set(['de', 'het', 'een', 'van', 'in', 'en', 'op', 'aan', 'bij'])

function stripDiacritics(value) {
  return value.normalize('NFD').replace(/\p{Mark}/gu, '')
}

function tokenize(text) {
  return stripDiacritics(text.toLowerCase())
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !STOPWORDS.has(word))
}

export function buildSerie({ naam, plaats }) {
  if (!naam) return null

  const naamZonderRuis = naam.replace(YEAR_RE, ' ').replace(ORDINAL_RE, ' ')
  const naamWoorden = tokenize(naamZonderRuis)

  let woorden = naamWoorden
  if (plaats) {
    const nieuweWoorden = tokenize(plaats).filter((word) => !naamWoorden.includes(word))
    woorden = [...naamWoorden, ...nieuweWoorden]
  }

  return woorden.join('-') || null
}
