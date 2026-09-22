// Herkent of twee evenementnamen waarschijnlijk hetzelfde evenement beschrijven,
// ook als de plaats ontbreekt of niet exact overeenkomt (zie lib/dedupe.js voor
// waarom dat nodig is: hardloopkalendernederland.nl laat 'plaats' soms leeg,
// terwijl runphy.nl juist wel een plaats geeft — en dan nog kan die plaats net
// anders zijn dan verwacht, bv. "Haren" i.p.v. "Groningen" voor exact dezelfde
// run, omdat Haren in 2019 bij de gemeente Groningen is gevoegd).
//
// Voorbeeld dat dit moet vangen (alle drie dezelfde run, 2026-10-11):
//   "4 mijl 4 You Haren - Groningen"   (plaats: null)
//   "De 4 mijl van Groningen"          (plaats: null)
//   "4 Mijl van Groningen"             (plaats: "Haren")
//
// Bewuste terughoudendheid: een gemiste duplicaat is onschuldig (de reviewer
// ziet gewoon twee concept-rijen voor dezelfde run in het admin-paneel en kan
// er zelf een verwijderen), maar een TEN ONRECHTE samengevoegd paar is dat
// niet — dan verdwijnt een echt, ander evenement stilletjes. Vandaar de eis
// van minstens één gedeeld woord dat geen generieke loopterm is.

import { normalize } from './dedupe.js'

const STOPWORDS = new Set(['de', 'het', 'een', 'van', 'in', 'en', 'op', 'aan', 'bij', '&'])

// Woorden die iets zeggen over het FORMAT van een run (afstand, type) maar
// niets over de IDENTITEIT ervan — komen in tientallen losstaande evenementen
// voor, dus tellen niet mee als "onderscheidend" gedeeld woord.
const GENERIC_WORDS = new Set([
  'km', 'kilometer', 'mijl', 'mijlen', 'mile', 'mi', 'loop', 'run', 'trail',
  'tocht', 'wandeling', 'marathon', 'halve', 'kwart', 'cross',
])

// Woorden die een kortere/jeugd-variant van een evenement aanduiden, bv.
// "Kleintje Berenloop" naast "Berenloop Terschelling" — in de Nederlandse
// hardloopwereld heel gebruikelijk als APARTE vermelding op de kalender naast
// het hoofdevenement (zelfde merknaam, andere afstand/doelgroep). Staat maar
// één van de twee namen zo'n woord, dan behandelen we ze als verschillende
// evenementen, ook al overlappen de overige woorden verder genoeg.
const VARIANT_MARKERS = new Set([
  'kleintje', 'mini', 'kids', 'kidsrun', 'jeugd', 'junior', 'pupillen',
  'benjamins', 'kinderloop', 'kinderrun', 'schoolloop', 'schoolrun',
])

function hasVariantMarker(tokens) {
  for (const token of tokens) {
    if (VARIANT_MARKERS.has(token)) return true
  }
  return false
}

function tokenize(name) {
  return normalize(name)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !STOPWORDS.has(word))
}

// Overlap-coëfficiënt (gedeelde woorden / kleinste woordenset) i.p.v. Jaccard:
// een lange naam met sponsor-/kidsrun-toevoeging ("Menzis 4 Mijl & Kids 4
// Mijl") moet niet slechter scoren tegen een korte naam ("4 Mijl van
// Groningen") puur omdat hij meer woorden bevat dan de andere naam heeft.
function overlapCoefficient(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0
  let shared = 0
  for (const token of setA) {
    if (setB.has(token)) shared++
  }
  return shared / Math.min(setA.size, setB.size)
}

export function namesLikelyMatch(nameA, nameB, { threshold = 0.5 } = {}) {
  if (!nameA || !nameB) return false

  const tokensA = new Set(tokenize(nameA))
  const tokensB = new Set(tokenize(nameB))

  if (hasVariantMarker(tokensA) !== hasVariantMarker(tokensB)) return false
  if (overlapCoefficient(tokensA, tokensB) < threshold) return false

  // Een kaal getal ("4", "5", "10") telt niet mee als onderscheidend woord —
  // dat is net als "km"/"mijl" gewoon een afstandsaanduiding die in talloze
  // losstaande evenementen voorkomt, geen identiteit op zich.
  for (const token of tokensA) {
    if (tokensB.has(token) && !GENERIC_WORDS.has(token) && !/^\d+$/.test(token)) return true
  }
  return false
}
