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

// Zet events die aan 'matchFn' voldoen bij elkaar (achter elkaar), zonder de
// oplopende (datum-)volgorde van de REST van de lijst te verstoren: alle
// niet-matchende events behouden exact hun eigen onderlinge volgorde, en de
// hele groep matches (ook onderling in hun oorspronkelijke volgorde) wordt in
// zijn geheel ingevoegd op de plek waar de EERSTE match oorspronkelijk stond
// — dus geen matches die naar voren/achteren springen in de tijdlijn, alleen
// die ene plek waar ze samen komen te staan.
function groupMatchesTogether(events, matchFn) {
  var matches = events.filter(matchFn);
  if (matches.length < 2) return events.slice();
  var firstMatchIndex = events.findIndex(matchFn);
  var rest = events.filter(function(ev) { return !matchFn(ev); });
  var insertAt = events.slice(0, firstMatchIndex).filter(function(ev) { return !matchFn(ev); }).length;
  return rest.slice(0, insertAt).concat(matches, rest.slice(insertAt));
}

// Match-functie voor de "4 Mijl"-editie die zowel als "...Groningen" als
// "...Haren" wordt aangeduid (Haren is in 2019 bij de gemeente Groningen
// gevoegd, en bronnen zijn het er niet altijd over eens welke naam ze tonen —
// zie ook lib/nameSimilarity.js in de scraper).
function isFourMijlGroningenOrHaren(ev) {
  var name = (ev.name_nl || '').toLowerCase();
  return name.indexOf('4 mijl') !== -1 && (name.indexOf('groningen') !== -1 || name.indexOf('haren') !== -1);
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

// Zet een afstandslabel om naar kilometers. De labels zijn rommelig
// ("5KM", "5 km", "21,1KM", "4 mi", "10km - 40km"), dus elk getal telt.
function distanceKmValues(label) {
  var s = String(label).toLowerCase().replace(/(\d),(\d)/g, '$1.$2');
  var nums = s.match(/\d+(\.\d+)?/g);
  if (!nums) {
    if (/halve marathon|half marathon/.test(s)) return [21.1];
    if (/marathon/.test(s)) return [42.2];
    return [];
  }
  var factor = /\bmi\b|mijl|mile/.test(s) ? 1.609 : 1;
  return nums.map(function(n) { return parseFloat(n) * factor; });
}

// Afstandsfilter: 'max:10' = minstens één afstand t/m 10 km,
// 'min:42.2' = minstens één afstand langer dan 42,2 km.
function matchesDistanceFilter(ev, filter) {
  var parts = String(filter).split(':');
  var limit = parseFloat(parts[1]);
  if (isNaN(limit)) return true;
  return (ev.distances || []).some(function(d) {
    return distanceKmValues(d).some(function(km) {
      return parts[0] === 'min' ? km > limit : km <= limit + 0.05;
    });
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
  'trail': 'images/trail.jpg',
  'swimrun':   'images/swimrun.jpg',
  'ultrarun':  'images/ultrarun.jpg',
  'urbanrun':  'images/urbanrun.jpg',
  'bikerun':   'images/bikerun.jpg',
};

// Fallback-foto op basis van de naam, voor events die (nog) een ander type
// hebben, bv. een "Bosloop" die door de scraper als 'wegevenement' is
// binnengekomen. Een bosloop telt als trail, maar 'cross' gaat voor (bv.
// "Boerbos Cross"). 'bosch' wordt uitgesloten zodat "Den Bosch" niet matcht.
var FALLBACK_IMAGE_BY_NAME = [
  { re: /cross/i,           image: 'images/cross.jpg' },
  { re: /trail|bos(?!ch)/i, image: 'images/trail.jpg' },
  { re: /swim|\bdip\b/i,    image: 'images/swimrun.jpg' },
];

function getImageByName(ev) {
  var name = (ev.name_nl || '') + ' ' + (ev.name_en || '');
  for (var i = 0; i < FALLBACK_IMAGE_BY_NAME.length; i++) {
    if (FALLBACK_IMAGE_BY_NAME[i].re.test(name)) return FALLBACK_IMAGE_BY_NAME[i].image;
  }
  return '';
}

// 'hondenloop' is geen type (kan bij elk type event aangevinkt worden, net als
// kidsrun), dus die fallback-foto wordt los gecheckt i.p.v. via FALLBACK_IMAGE_BY_TYPE.
function getEventImage(ev) {
  if (ev.type === 'baanevenement') return 'images/baanevenement.jpg';
  if (!ev.image && ev.hondenloop) return 'images/hondenloop.jpg';
  if (!ev.image && (ev.type === 'cross' || ev.type2 === 'cross')) return 'images/cross.jpg';
  if (!ev.image && (ev.type === 'trail' || ev.type2 === 'trail')) return 'images/trail.jpg';
  if (!ev.image && getImageByName(ev)) return getImageByName(ev);
  if (!ev.image && FALLBACK_IMAGE_BY_TYPE[ev.type]) return FALLBACK_IMAGE_BY_TYPE[ev.type];
  return ev.image;
}

// Postcode- en plaatscoördinaten voor het postcode/straal-filter (agenda + regio's)
function getPostalCoords(postal4) {
  var key = postal4;
  if (POSTAL_CODES[key]) return POSTAL_CODES[key];
  // try rounding down to nearest known prefix
  for (var k in POSTAL_CODES) {
    if (Math.abs(parseInt(k) - parseInt(key)) < 100) return POSTAL_CODES[k];
  }
  return null;
}

function cityCoords(city) {
  var map = {
    'Groningen': {lat:53.2194,lng:6.5665}, 'Utrecht': {lat:52.0907,lng:5.1214},
    'Rotterdam': {lat:51.9225,lng:4.4792}, 'Leiden': {lat:52.1601,lng:4.4970},
    '(online)': null, 'Delft': {lat:52.0116,lng:4.3571}, 'Arnhem': {lat:51.9851,lng:5.8987},
    'Haarlem': {lat:52.3874,lng:4.6462}, 'Eindhoven': {lat:51.4416,lng:5.4697},
    'Zwolle': {lat:52.5168,lng:6.0830}, 'Amsterdam': {lat:52.3676,lng:4.9041},
    'Middelburg': {lat:51.4988,lng:3.6136}, 'Maastricht': {lat:50.8514,lng:5.6910},
    'Den Haag': {lat:52.0705,lng:4.3007}, 'Assen': {lat:52.9926,lng:6.5611},
    'Nijmegen': {lat:51.8126,lng:5.8372}, 'Leeuwarden': {lat:53.2012,lng:5.7999},
    'Almere': {lat:52.3508,lng:5.2647}
  };
  return map[city] || null;
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
