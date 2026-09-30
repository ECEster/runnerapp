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
// Eerste letter van elk woord hoofdletter, rest kleine letters.
// Werkt ook op ALL-CAPS invoer van de scraper.
// Uitzondering: 's- (zoals 's-Hertogenbosch) blijft lowercase na apostrof.
function titleCase(str) {
  if (!str) return str;
  return str.toLowerCase()
    .replace(/\b[a-zà-ÿ]/g, function(c) { return c.toUpperCase(); })
    .replace(/'[A-Z]/g, function(m) { return m.toLowerCase(); });
}

// Zet alleen de allereerste letter van een tekst in hoofdletters, de rest in
// kleine letters (bv. "AMSTERDAM" of "amsterdam" -> "Amsterdam"). Anders dan
// titleCase() hierboven (die per woord een hoofdletter zet) — bedoeld voor
// het Stad/Plaats-veld in het admin-formulier.
function capitalizeFirst(str) {
  if (!str) return str;
  var trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// Zet events met een bepaalde tekst in de naam bij elkaar (achter elkaar),
// zonder de bestaande onderlinge volgorde te verstoren — bv. alle "4 mijl"-
// evenementen samen vooraan, elk onderling nog gewoon op datum. Werkt via
// een stabiele sort (gegarandeerd stabiel sinds ES2019) op alleen de
// wel/niet-match, dus de volgorde bínnen elke groep blijft exact zoals 'ie
// binnenkwam.
function groupByNameMatch(events, needle) {
  var lowerNeedle = needle.toLowerCase();
  return events.slice().sort(function(a, b) {
    var aMatch = (a.name_nl || '').toLowerCase().indexOf(lowerNeedle) !== -1;
    var bMatch = (b.name_nl || '').toLowerCase().indexOf(lowerNeedle) !== -1;
    if (aMatch === bMatch) return 0;
    return aMatch ? -1 : 1;
  });
}

function formatPrice(price) {
  if (!price) return price;
  var p = String(price).trim();
  if (!p || p.indexOf('€') !== -1 || !/^\d/.test(p)) return p;
  return '€' + p;
}

// Rondt het decimale deel van een afstand af op 1 cijfer na de punt, bv.
// "6.437km" -> "6.4km", "42.195KM" -> "42.2KM". Afstanden zonder decimalen
// (zoals "10km") blijven ongewijzigd. Bedoeld voor weergave — de brontekst in
// de database (met volledige precisie) blijft ongemoeid.
function roundDistanceLabel(distance) {
  return distance.replace(/(\d+)\.(\d+)/, function(_, whole, decimals) {
    return (Math.round(parseFloat(whole + '.' + decimals) * 10) / 10).toFixed(1);
  });
}

// Geeft de juiste prijs-HTML terug voor een eventcard:
// gratis → groene badge, prijs bekend → toon prijs, prijs onbekend → "Zie website"
function makePriceHtml(ev, lang) {
  if (!ev.paid) {
    return '<span class="event-card__price free">' + (lang === 'en' ? 'Free' : 'Gratis') + '</span>';
  }
  if (ev.price) {
    return '<span class="event-card__price">' + formatPrice(ev.price) + '</span>';
  }
  return '';
}

// Geeft de afbeelding voor een evenement terug. Baanevenementen tonen altijd
// dezelfde vaste foto (images/baanevenement.jpg) — handig omdat veel
// (geïmporteerde) baanevenementen geen eigen foto hebben.
//
// De types hieronder tonen hun vaste foto alleen als FALLBACK (dus niet
// altijd, in tegenstelling tot baanevenement hierboven) — 'wegevenement' is
// bijvoorbeeld de placeholder die de scraper aan elk nieuw event toekent
// (zie scraper/lib/mapToSupabaseShape.js), dus verreweg de meeste evenementen
// met dit type hebben nog geen eigen foto — maar een handjevol handmatig
// toegevoegde evenementen heeft er al wél een, en die mag niet overschreven
// worden.
var FALLBACK_IMAGE_BY_TYPE = {
  'wegevenement': 'images/wegevenement.jpg',
  'parkloop': 'images/parkloop.jpg',
  'gemengd parcours': 'images/gemengd-parcours.png',
  'cross': 'images/cross.jpg',
  'swimrun':   'images/swimrun.jpg',
  'ultrarun':  'images/ultrarun.jpg',
  'urbanrun':  'images/urbanrun.jpg',
  'bikerun':   'images/bikerun.jpg',
};

// 'hondenloop' is geen type (kan bij elk type event aangevinkt worden, net als
// kidsrun), dus die fallback-foto wordt los gecheckt i.p.v. via FALLBACK_IMAGE_BY_TYPE.
function getEventImage(ev) {
  if (ev.type === 'baanevenement') return 'images/baanevenement.jpg';
  if (!ev.image && ev.hondenloop) return 'images/hondenloop.jpg';
  if (!ev.image && FALLBACK_IMAGE_BY_TYPE[ev.type]) return FALLBACK_IMAGE_BY_TYPE[ev.type];
  return ev.image;
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
