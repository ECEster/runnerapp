// Probeert te herkennen of een evenement een kidsrun/jeugdonderdeel heeft, op
// basis van de naam en de afstand-/onderdeelnamen die we al scrapen.
//
// BEWUSTE BEPERKING: dit kan alleen iets herkennen wat de bron zelf al noemt.
// runphy.nl geeft per evenement een lijst met "offers" (afstanden/onderdelen);
// als de kidsrun daar niet als apart onderdeel in staat — bv. bij "Kûbaarder
// Hurdrindei" noemt runphy.nl alleen "5 km, 10,2 km, 21,1 km", terwijl de
// organisator (kubaarddorp.nl) daarnaast wél een kidsrun aanbiedt — dan heeft
// deze functie niets om op te matchen en blijft kidsrun: false staan. Dat is
// geen bug in de herkenning, maar een gat in wat de bron zelf vermeldt; de
// enige manier om dat te dichten zou zijn om ook elke organisator-eigen
// website te bezoeken (fragiel — elke site heeft een andere structuur, dus
// bewust niet gedaan). Corrigeer zulke gevallen tijdens het reviewen in het
// admin-paneel.
//
// We scannen bewust alleen de naam en de (korte, gestructureerde)
// afstand-/onderdeelnamen — niet de vrije-tekst beschrijving, want die kan
// het woord "kinderen" ook noemen zonder dat er een kidsrun is (bv. "niet
// geschikt voor kinderen jonger dan 12").
const KIDS_KEYWORDS = [
  'kids', 'kidsrun', 'jeugd', 'jeugdloop', 'jeugdrun', 'kinderloop',
  'kinderrun', 'kinderen', 'mini', 'pupillen', 'benjamins', 'schoolloop',
  'schoolrun',
]

export function detectKidsrun(event) {
  const haystacks = [event.naam, ...(event.afstanden ?? [])]
  return haystacks.some((text) => {
    if (!text) return false
    const normalized = text.toLowerCase()
    return KIDS_KEYWORDS.some((keyword) => normalized.includes(keyword))
  })
}
