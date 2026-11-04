// Herkent een kidsrun/jeugdloop in de tekst van de site van de organisator,
// voor evenementen waarvan de bron de kidsrun niet noemt (zie
// lib/detectKidsrun.js: dat kijkt alleen naar naam en afstanden).
//
// Uitkomst:
//   { sure: true, quote }   duidelijke vermelding mét afstand, tijd of prijs
//                           vlakbij ("Kidsrun 1 km", "Jeugdloop 13.30 uur",
//                           "Kinderloop € 3") -> kidsrun meteen aanzetten
//   { sure: false, quote }  het woord staat er, maar zonder zo'n detail
//                           -> voorstel in het admin-paneel
//   null                    niets gevonden, of "geen kidsrun"/"vervalt"
//
// Liever een kidsrun missen dan er ten onrechte een aanzetten: ouders komen
// anders voor niets.

const KIDS = /\b(?:kids\s?run|kids\s?race|kidsloop|kinder\s?loop|kinderrun|jeugd\s?loop|jeugdrun|jeugdlopen|mini[\s-]?run|pupillenloop|scholierenloop|bambinoloop|bambino\s?run|guppieloop|kabouterloop|kleuterloop)\b/gi
// "1 km jeugd", "jeugd t/m 12 jaar ... 1500 m": alleen samen met een afstand
const JEUGD_MET_AFSTAND = /\b(?:\d+(?:[.,]\d+)?\s?(?:km|m|meter))\s+(?:jeugd|kinderen|kids)\b|\b(?:jeugd|kinderen|kids)\s+(?:\(?(?:\d{1,2}\s?(?:-|t\/m)\s?|t\/m\s?)\d{1,2}\s?(?:jaar|jr)\)?\s+)?\d+(?:[.,]\d+)?\s?(?:km|m|meter)\b/gi
const DETAIL = /\d+(?:[.,]\d+)?\s?(?:km|m|meter)\b|\b\d{1,2}[.:]\d{2}\s?(?:uur|u)?\b|€\s?\d|\b\d{1,2}\s?(?:-|t\/m)\s?\d{1,2}\s?(?:jaar|jr)\b/i
const NOT = /\b(?:geen|niet|vervalt|vervallen|gaat\s+niet\s+door|afgelast|geschrapt|niet\s+meer)\b/i

export function detectKidsrunText(text) {
  let best = null
  const check = (m) => {
    const before = text.slice(Math.max(0, m.index - 40), m.index)
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 30)
    if (NOT.test(before) || /^\s*(?:vervalt|gaat\s+niet|is\s+afgelast|dit\s+jaar\s+niet)/i.test(after)) return
    const around = text.slice(Math.max(0, m.index - 50), m.index + m[0].length + 60)
    const sure = DETAIL.test(around)
    const quote = around.trim().slice(0, 200)
    if (!best || (sure && !best.sure)) best = { sure, quote }
  }
  for (const re of [KIDS, JEUGD_MET_AFSTAND]) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) check(m)
  }
  return best
}
