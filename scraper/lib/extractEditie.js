// extractEditie.js — haalt een editienummer uit de RUWE (nog niet
// opgeschoonde) brontekst van een evenementnaam, of berekent het uit een
// genoemd oprichtingsjaar. Vult NOOIT een gok in: geen match => null.
//
// Twee signalen:
// 1. Een leidend rangtelwoord vóór de naam, bv. "22ste Proostmeerloop" of
//    "42e Marathon Rotterdam" — dat getal IS het editienummer, ook als het
//    woord "editie" zelf niet in de tekst voorkomt.
// 2. "sinds JJJJ" (of "sinds het jaar JJJJ") ergens in de tekst — het
//    editienummer van déze editie wordt dan berekend als
//    jaar(datum) - JJJJ + 1. Komt bij de huidige 3 bronnen niet voor (geen
//    ervan levert vrije beschrijvingstekst), maar wordt zo automatisch
//    meegenomen zodra dat verandert.
const LEADING_ORDINAL_RE = /^\s*(\d{1,3})\s*(?:e|de|ste)\b/i
const SINDS_RE = /\bsinds\s+(?:het\s+jaar\s+)?(\d{4})\b/i

export function extractEditie({ rawNaam, datum }) {
  if (!rawNaam) return null

  const ordinalMatch = rawNaam.match(LEADING_ORDINAL_RE)
  if (ordinalMatch) {
    const nummer = Number(ordinalMatch[1])
    return nummer > 0 ? nummer : null
  }

  const sindsMatch = rawNaam.match(SINDS_RE)
  if (sindsMatch && datum) {
    const opgericht = Number(sindsMatch[1])
    const eventJaar = Number(String(datum).slice(0, 4))
    if (eventJaar && opgericht <= eventJaar) {
      const editie = eventJaar - opgericht + 1
      return editie > 0 ? editie : null
    }
  }

  return null
}
