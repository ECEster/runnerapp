// data.js — global data for runningnederland.nl

// De 18 oorspronkelijke voorbeeldevenementen zijn op 2026-09-11 via het
// admin-paneel geimporteerd naar de database (zie migratieknop in
// admin-panel.html) en zijn nu daar bewerkbaar. STATIC_EVENTS blijft
// als lege fallback bestaan voor het geval Supabase niet bereikbaar is.
var STATIC_EVENTS = [];

// Werkkopie die de pagina's uitlezen; loadEventsFromDB() vult deze aan.
var EVENTS = STATIC_EVENTS.slice();

// Dutch postal code prefixes mapped to {lat, lng}
var POSTAL_CODES = {
  "1000": { lat: 52.3676, lng: 4.9041 },   // Amsterdam
  "2500": { lat: 52.0705, lng: 4.3007 },   // Den Haag
  "3000": { lat: 51.9225, lng: 4.4792 },   // Rotterdam
  "3500": { lat: 52.0907, lng: 5.1214 },   // Utrecht
  "9700": { lat: 53.2194, lng: 6.5665 },   // Groningen
  "5600": { lat: 51.4416, lng: 5.4697 },   // Eindhoven
  "8000": { lat: 52.5168, lng: 6.0830 },   // Zwolle
  "2000": { lat: 52.3874, lng: 4.6462 },   // Haarlem
  "2600": { lat: 52.0116, lng: 4.3571 },   // Delft
  "6800": { lat: 51.9851, lng: 5.8987 },   // Arnhem
  "4300": { lat: 51.4988, lng: 3.6136 },   // Middelburg
  "6200": { lat: 50.8514, lng: 5.6910 },   // Maastricht
  "2700": { lat: 52.0579, lng: 4.4938 },   // Zoetermeer
  "9400": { lat: 52.9926, lng: 6.5611 },   // Assen
  "8900": { lat: 53.2012, lng: 5.7999 },   // Leeuwarden
  "6500": { lat: 51.8126, lng: 5.8372 },   // Nijmegen
  "1300": { lat: 52.3508, lng: 5.2647 },   // Almere
  "2300": { lat: 52.1601, lng: 4.4970 },   // Leiden
  "7500": { lat: 52.2215, lng: 6.8937 },   // Enschede
  "6700": { lat: 51.9693, lng: 5.6660 }    // Wageningen
};

// Formatteert een prijsveld: zet er automatisch een euroteken voor als
// het ontbreekt (bijv. "15" -> "€15", "25-45" -> "€25-45"). Waarden die
// al een € bevatten, of geen bedrag zijn (zoals "gratis" of "n.b."),
// blijven ongewijzigd.
function formatPrice(price) {
  if (!price) return price;
  var p = String(price).trim();
  if (!p || p.indexOf('€') !== -1 || !/^\d/.test(p)) return p;
  return '€' + p;
}

// Haversine distance formula
function haversineKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
