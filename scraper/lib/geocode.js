// Zoekt coördinaten van een plaats op via de PDOK Locatieserver (gratis,
// Nederlandse overheid, geen sleutel nodig). Eerst als woonplaats, anders als
// gemeente; met provincie erbij om dubbele plaatsnamen (bv. "Hoogeveen" vs.
// een gelijknamig dorp elders) goed te kiezen.

const PDOK_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free'

function parsePoint(wkt) {
  const m = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(wkt || '')
  return m ? { lat: parseFloat(m[2]), lng: parseFloat(m[1]) } : null
}

async function search(q, type) {
  const url = `${PDOK_URL}?q=${encodeURIComponent(q)}&fq=type:${type}&rows=1&fl=weergavenaam,centroide_ll`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`PDOK HTTP ${res.status}`)
  const data = await res.json()
  const doc = data.response && data.response.docs && data.response.docs[0]
  return doc ? { ...parsePoint(doc.centroide_ll), naam: doc.weergavenaam } : null
}

export async function geocodePlace(city, province) {
  if (!city) return null
  const q = province ? `${city} ${province}` : city
  return (await search(q, 'woonplaats')) || (await search(q, 'gemeente'))
}
