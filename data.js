// data.js — global data for runningnederland.nl

// ─── REAL EVENTS (verified from public sources, April 2026) ────────────────
// Sources: nnmarathonrotterdam.nl, nndamloop.nl, tcsamsterdammarathon.nl,
//   egmondhalvemarathon.nl, nnzevenheuvelenloop.nl, zevenheuvelentrail.nl,
//   hardloopnetwerk.nl, berenloopterschelling.nl, tilburgtenmiles.nl,
//   enschedemarathon.nl, lentemarathon.nl, marathon.nl, bruggenloop.nl,
//   zandvoortcircuitrun.nl, sportpromotiediever.nl, bearsports.nl

var EVENTS = [
  {
    id: 101,
    name_nl: "Egmond Halve Marathon",
    name_en: "Egmond Half Marathon",
    date: "2026-01-11",
    type: "wegevenement",
    city: "Egmond aan Zee",
    province: "Noord-Holland",
    distances: ["10.5km", "21.1km"],
    paid: true,
    // Half marathon €25–€30 (Le Champion pricing); quarter marathon also available
    price: "€25–€30",
    atletiekunie: true,
    capacity: 18500,
    organizer: "Le Champion",
    description_nl: "De 51e editie van de Egmond Halve Marathon langs de Noordzeekust. Met ruim 18.500 deelnemers één van de grootste loopevenementen van Nederland in januari. Geheel uitverkocht voor de halve en kwart marathon.",
    description_en: "The 51st edition of the Egmond Half Marathon along the North Sea coast. With over 18,500 participants, one of the largest running events in the Netherlands in January.",
    image: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80",
    registration_url: "https://www.egmondhalvemarathon.nl/inschrijven",
    youtube_url: ""
  },
  {
    id: 102,
    name_nl: "Centraal Beheer Midwinter Marathon Apeldoorn",
    name_en: "Centraal Beheer Midwinter Marathon Apeldoorn",
    date: "2026-02-01",
    type: "marathon",
    city: "Apeldoorn",
    province: "Gelderland",
    distances: ["4km", "8km", "10km", "25km", "42km"],
    paid: true,
    price: "€10–€45",
    atletiekunie: true,
    capacity: null,
    organizer: "Midwinter Marathon Apeldoorn",
    description_nl: "De 51e editie van de Centraal Beheer Midwinter Marathon Apeldoorn. Driedaags evenement (30 jan – 1 feb) met een Night Run (4 km), de Acht van Apeldoorn (8 km), de Asselronde (25 km) en de volle marathon (42 km). Volledig uitverkocht.",
    description_en: "The 51st edition of the Midwinter Marathon Apeldoorn. A three-day event (30 Jan – 1 Feb) featuring a Night Run (4 km), the Eight of Apeldoorn (8 km), the Asselronde (25 km) and the full marathon (42 km). Fully sold out.",
    image: "https://images.unsplash.com/photo-1596727362302-b8d891c42ab8?w=800&q=80",
    registration_url: "https://www.midwintermarathon.nl/inschrijven/",
    youtube_url: ""
  },
  {
    id: 103,
    name_nl: "KPMG Lentemarathon Amstelveen",
    name_en: "KPMG Spring Marathon Amstelveen",
    date: "2026-03-15",
    type: "marathon",
    city: "Amstelveen",
    province: "Noord-Holland",
    distances: ["5km", "10km", "21km", "42km"],
    paid: true,
    price: "€20–€80",
    atletiekunie: true,
    capacity: null,
    organizer: "Golazo Athletics",
    description_nl: "De 7e editie van de KPMG Lentemarathon Amstelveen met start en finish in het Stadshart Amstelveen. Op zaterdag 14 maart is er een 5K Night Run; op zondag de volledige programmering. Keuze uit marathon, halve marathon, 10K, 5K, estafette en Kids Run.",
    description_en: "The 7th edition of the KPMG Spring Marathon Amstelveen, starting and finishing in the heart of Amstelveen. A 5K Night Run on Saturday 14 March; full programme on Sunday. Choose from marathon, half marathon, 10K, 5K, relay and Kids Run.",
    image: "https://images.unsplash.com/photo-1544899489-a083461b088c?w=800&q=80",
    registration_url: "https://www.lentemarathon.nl/inschrijven/",
    youtube_url: ""
  },
  {
    id: 104,
    name_nl: "Heuvelland Marathon Vaals–Gulpen",
    name_en: "Heuvelland Trail Marathon Vaals–Gulpen",
    date: "2026-03-15",
    type: "trail",
    city: "Vaals",
    province: "Limburg",
    distances: ["14km", "21km", "42km"],
    paid: true,
    price: "€25–€85",
    atletiekunie: false,
    capacity: null,
    organizer: "Bearsports",
    description_nl: "De Heuvelland Marathon is een trail-marathon door het Zuid-Limburgse heuvelland. Start in Vaals, finish in Gulpen. Keuze uit 14 km (€25), halve marathon (€40) of volle marathon (€85). Er zijn ook duo- en estafette-opties. Georganiseerd door Bearsports.",
    description_en: "The Heuvelland Marathon is a trail marathon through the hills of South Limburg. Start in Vaals, finish in Gulpen. Choose from 14 km (€25), half marathon (€40) or full marathon (€85). Duo and relay options also available. Organised by Bearsports.",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
    registration_url: "https://www.bearsports.nl/heuvellandmarathon/",
    youtube_url: ""
  },
  {
    id: 105,
    name_nl: "Zandvoort Circuit Run",
    name_en: "Zandvoort Circuit Run",
    date: "2026-03-29",
    type: "wegevenement",
    city: "Zandvoort",
    province: "Noord-Holland",
    distances: ["4km", "12km", "16.1km"],
    paid: true,
    price: "€19–€30",
    atletiekunie: false,
    capacity: null,
    organizer: "Le Champion",
    description_nl: "Hardlopen op het Circuit Zandvoort! Beschikbare afstanden: 4 km (€19), 12 km (€27,50) en 16,1 km (€30). Jeugdafstanden van 0,9 en 2,6 km zijn €6. Hoofdafstanden volledig uitverkocht; beperkte tickets via business- en Diabetes Fonds-kanalen beschikbaar.",
    description_en: "Running on the Zandvoort Formula 1 circuit! Distances: 4 km (€19), 12 km (€27.50) and 16.1 km (€30). Youth distances (0.9 km and 2.6 km) cost €6. Main distances sold out; limited tickets via business and Diabetes Fund channels.",
    image: "https://images.unsplash.com/photo-1530143584546-02191bc84eb5?w=800&q=80",
    registration_url: "https://www.zandvoortcircuitrun.nl/inschrijven",
    youtube_url: ""
  },
  {
    id: 106,
    name_nl: "Drents-Friese Wold Marathon",
    name_en: "Drents-Friese Wold Marathon",
    date: "2026-03-28",
    type: "wegevenement",
    city: "Diever",
    province: "Drenthe",
    distances: ["10.5km", "21.1km", "31.7km", "42.2km"],
    paid: true,
    price: "€8.50–€20",
    atletiekunie: false,
    capacity: null,
    organizer: "Stichting Sportpromotie Diever",
    description_nl: "De Drents-Friese Wold Marathon voert door het prachtige Drents Friese Woud rondom Diever. Zeer betaalbare inschrijvingen: 10,5 km €8,50 | 21,1 km €14 | 31,7 km €16,50 | 42,2 km €20. Online voorinschrijving tot 25 maart.",
    description_en: "The Drents-Friese Wold Marathon runs through the beautiful Drents Friese Wold forest near Diever. Very affordable entry fees: 10.5 km €8.50 | 21.1 km €14 | 31.7 km €16.50 | 42.2 km €20. Online pre-registration until 25 March.",
    image: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800&q=80",
    registration_url: "https://sportpromotiediever.nl/drents-friese-woldmarathon/",
    youtube_url: ""
  },
  {
    id: 107,
    name_nl: "NN Marathon Rotterdam + NK",
    name_en: "NN Marathon Rotterdam (Dutch Championships)",
    date: "2026-04-12",
    type: "marathon",
    city: "Rotterdam",
    province: "Zuid-Holland",
    distances: ["4.2km", "10.55km", "42.2km"],
    paid: true,
    price: "€17.50–€155",
    atletiekunie: true,
    capacity: null,
    organizer: "NN Marathon Rotterdam",
    description_nl: "De 45e editie van de NN Marathon Rotterdam, tevens NK Marathon. Zaterdagprogramma (11 april) met CityRun 4,2 km (€17,50) en Kids Runs. Zondag 12 april: 10,55 km (€38) en marathon (€155 incl. reservering). Loterij voor de marathon; 5000 garantieplekken voor leden.",
    description_en: "The 45th NN Marathon Rotterdam, also hosting the Dutch Athletics Championships. Saturday programme (11 April): CityRun 4.2 km (€17.50) and Kids Runs. Sunday 12 April: 10.55 km (€38) and marathon (€155 incl. registration). Lottery entry system for the marathon.",
    image: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=800&q=80",
    registration_url: "https://nnmarathonrotterdam.nl/en/register/",
    youtube_url: ""
  },
  {
    id: 108,
    name_nl: "Elektramat Enschede Marathon",
    name_en: "Enschede Marathon",
    date: "2026-04-12",
    type: "marathon",
    city: "Enschede",
    province: "Overijssel",
    distances: ["1km", "5km", "10km", "21km", "42km"],
    paid: true,
    price: "€17.50–€75",
    atletiekunie: true,
    capacity: null,
    organizer: "Stichting Enschede Marathon",
    description_nl: "De Elektramat Enschede Marathon, de oudste marathon van Nederland. Op 12 april 2026 kun je kiezen uit 1 km, 5 km, 10 km (ROSEN CityRUN, vanaf €17,50), halve marathon (Forvis Mazars, v.a. €32,50) en marathon (v.a. €55 vroegboek). Stadscentrum van Enschede.",
    description_en: "The Elektramat Enschede Marathon, the oldest marathon in the Netherlands. On 12 April 2026 choose from 1 km, 5 km, 10 km (ROSEN CityRUN from €17.50), half marathon (from €32.50) and marathon (from €55 early bird). Through the city centre of Enschede.",
    image: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800&q=80",
    registration_url: "https://www.enschedemarathon.nl/en/registration/",
    youtube_url: ""
  },
  {
    id: 109,
    name_nl: "Logus – De Hoop Marathon Zeeuws-Vlaanderen",
    name_en: "Marathon Zeeuws-Vlaanderen",
    date: "2026-04-12",
    type: "marathon",
    city: "Terneuzen",
    province: "Zeeland",
    distances: ["5km", "10km", "42.2km"],
    paid: true,
    price: "n.b.",
    atletiekunie: true,
    capacity: 850,
    organizer: "Stichting Marathon Zeeuws-Vlaanderen",
    description_nl: "De 16e editie van de Marathon Zeeuws-Vlaanderen in Terneuzen (Zeeland), officieel genaamd 'Logus – De Hoop Marathon Zeeuws-Vlaanderen'. Slechts 850 plaatsen beschikbaar. Inschrijving opende 1 november 2025. Afstanden: 5 km, 10 km en marathon.",
    description_en: "The 16th edition of the Marathon Zeeuws-Vlaanderen in Terneuzen (Zeeland), officially called 'Logus – De Hoop Marathon Zeeuws-Vlaanderen'. Only 850 places available. Registration opened 1 November 2025. Distances: 5 km, 10 km and marathon.",
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80",
    registration_url: "https://marathonzvl.nl/",
    youtube_url: ""
  },
  {
    id: 110,
    name_nl: "35e Leiden Marathon",
    name_en: "Leiden Marathon (35th edition)",
    date: "2026-05-10",
    type: "marathon",
    city: "Leiden",
    province: "Zuid-Holland",
    distances: ["5km", "10km", "21km", "42km"],
    paid: true,
    price: "€16–€69",
    atletiekunie: true,
    capacity: null,
    organizer: "Stichting Leiden Marathon",
    description_nl: "De 35e editie van de Leiden Marathon door de historische Leidse grachten. Zaterdagavond 5K Night Run (€16); zondag 10 mei: 10 km (€29), halve marathon (€42) en marathon (€69). Ook een Kidsrun.",
    description_en: "The 35th Leiden Marathon through the historic Leiden canals. Saturday evening 5K Night Run (€16); Sunday 10 May: 10 km (€29), half marathon (€42) and marathon (€69). Also a Kids Run.",
    image: "https://images.unsplash.com/photo-1504025468847-0e438279542c?w=800&q=80",
    registration_url: "https://marathon.nl/hardlopen/",
    youtube_url: ""
  },
  {
    id: 111,
    name_nl: "Kastelenloop Diepenheim",
    name_en: "Kastelenloop Diepenheim",
    date: "2026-05-09",
    type: "wegevenement",
    city: "Diepenheim",
    province: "Overijssel",
    distances: ["21km"],
    paid: true,
    price: "n.b.",
    atletiekunie: false,
    capacity: null,
    organizer: "OLC-93 / kastelenloopdiepenheim.nl",
    description_nl: "De Kastelenloop Diepenheim is een avondevenement (zaterdagavond 9 mei) door het pittoreske boerenland van Twente langs kastelen en buitenplaatsen. Alleen een individuele halve marathon (21 km) en estafette voor teams van 2 of 3. Voorinschrijving verplicht, geen dagregistratie.",
    description_en: "The Kastelenloop Diepenheim is an evening event (Saturday 9 May) through the picturesque Twente countryside past castles and country estates. Individual half marathon (21 km) and relay for teams of 2 or 3. Pre-registration required; no day registration.",
    image: "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&q=80",
    registration_url: "https://olc-93.nl/inschrijven/kastelenloop-diepenheim-2026",
    youtube_url: ""
  },
  {
    id: 112,
    name_nl: "Zevenheuvelentrail Nijmegen",
    name_en: "Seven Hills Trail Nijmegen",
    date: "2026-09-26",
    type: "trail",
    city: "Nijmegen",
    province: "Gelderland",
    distances: ["7km", "14km", "21km", "28km", "42km", "56km"],
    paid: true,
    price: "€18.95+",
    atletiekunie: true,
    capacity: null,
    organizer: "Stichting Zevenheuvelenloop",
    description_nl: "De 5e editie van de Zevenheuvelentrail door de bossen rondom Nijmegen. Keuze uit 7 km (€18,95; €10 voor -18 jaar), 14 km, 21 km, 28 km (NK Korte Trail), 42 km en 56 km (NK Lange Trail). Inschrijving sluit 13 september 2026.",
    description_en: "The 5th edition of the Zevenheuvelentrail through the forests around Nijmegen. Choose from 7 km (€18.95; €10 for under 18), 14 km, 21 km, 28 km (Dutch Champs Short Trail), 42 km and 56 km (Dutch Champs Long Trail). Registration closes 13 September 2026.",
    image: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800&q=80",
    registration_url: "https://atleta.cc/e/qPULkTDsHa4S",
    youtube_url: ""
  },
  {
    id: 113,
    name_nl: "CZ Tilburg Ten Miles",
    name_en: "CZ Tilburg Ten Miles",
    date: "2026-09-27",
    type: "wegevenement",
    city: "Tilburg",
    province: "Noord-Brabant",
    distances: ["5km", "10km", "16.1km"],
    paid: true,
    price: "n.b.",
    atletiekunie: true,
    capacity: 15000,
    organizer: "Golazo Athletics B.V.",
    description_nl: "De gezelligste hardloopdag van het jaar! Zaterdag 27 september (wandeltochten 5/10/16 km, TTM Wandeltocht) en zondag 28 september (Tilburg Ten Miles 16,1 km, 10 km, 5 km, Business Run, Family Run). Verwachte deelname: meer dan 15.000 lopers op zondag.",
    description_en: "The most fun running day of the year! Saturday 27 September (walks 5/10/16 km) and Sunday 28 September (Ten Miles 16.1 km, 10 km, 5 km, Business Run, Family Run). Expected turnout: more than 15,000 runners on Sunday.",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80",
    registration_url: "https://tilburgtenmiles.nl/inschrijven/",
    youtube_url: ""
  },
  {
    id: 114,
    name_nl: "NN Zevenheuvelenloop Nijmegen",
    name_en: "NN Seven Hills Run Nijmegen",
    date: "2026-11-15",
    type: "wegevenement",
    city: "Nijmegen",
    province: "Gelderland",
    distances: ["7km", "15km"],
    paid: true,
    price: "€22.95–€28.95",
    atletiekunie: true,
    capacity: null,
    organizer: "Stichting Zevenheuvelenloop",
    description_nl: "De 41e NN Zevenheuvelenloop. Zaterdag 14 november: NN Zevenheuvelennacht 7 km (€22,95, start 19:00). Zondag 15 november: NN Zevenheuvelenloop 15 km (€28,95, start 13:00). Tot 18 jaar: €10. Medaille bijbestellen voor €3,50. Inschrijving opent 1 juni 2026.",
    description_en: "The 41st NN Seven Hills Run. Saturday 14 November: NN Seven Hills Night Run 7 km (€22.95, start 19:00). Sunday 15 November: NN Seven Hills Run 15 km (€28.95, start 13:00). Under-18s: €10. Extra medal €3.50. Registration opens 1 June 2026.",
    image: "https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800&q=80",
    registration_url: "https://nnzevenheuvelenloop.nl/inschrijven",
    youtube_url: ""
  },
  {
    id: 115,
    name_nl: "Berenloop Terschelling Marathon",
    name_en: "Berenloop Terschelling Marathon",
    date: "2026-11-01",
    type: "wegevenement",
    city: "West-Terschelling",
    province: "Friesland",
    distances: ["5km", "10km", "21.1km", "42.2km"],
    paid: true,
    price: "€36.50–€41",
    atletiekunie: false,
    capacity: null,
    organizer: "Stichting Berenloop Terschelling",
    description_nl: "Eén van de mooiste en zwaarste marathons van Nederland op het Waddeneiland Terschelling. Halve marathon (€36,50, start 12:00) en volle marathon (€41, start 12:40). Zaterdag ook 5 en 10 km. Inschrijving 11 maart – 20 september 2026.",
    description_en: "One of the most beautiful and toughest marathons in the Netherlands on the Wadden Island Terschelling. Half marathon (€36.50, start 12:00) and full marathon (€41, start 12:40). Saturday also 5 and 10 km. Registration 11 March – 20 September 2026.",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80",
    registration_url: "https://www.berenloopterschelling.nl/",
    youtube_url: ""
  },
  {
    id: 116,
    name_nl: "NN Dam tot Damloop",
    name_en: "NN Dam to Dam Run",
    date: "2026-09-20",
    type: "wegevenement",
    city: "Amsterdam",
    province: "Noord-Holland",
    distances: ["8km", "16.1km"],
    paid: true,
    price: "€37.50",
    atletiekunie: true,
    capacity: null,
    organizer: "Le Champion / NN",
    description_nl: "De NN Dam tot Damloop: van Amsterdam Dam naar het Damrak in Zaandam. Zaterdag 19 september en zondag 20 september 2026. Afstanden: 10 Engelse Mijl (16,1 km, €37,50) en 5 Engelse Mijl (8 km). Business teams ook welkom. Le Champion leden ontvangen 10% korting.",
    description_en: "The NN Dam to Dam Run from Amsterdam's Dam Square to Zaandam. Saturday 19 and Sunday 20 September 2026. Distances: 10 English miles (16.1 km, €37.50) and 5 English miles (8 km). Business teams welcome. Le Champion members get 10% discount.",
    image: "https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?w=800&q=80",
    registration_url: "https://www.nndamloop.nl/inschrijven",
    youtube_url: ""
  },
  {
    id: 117,
    name_nl: "TCS Amsterdam Marathon",
    name_en: "TCS Amsterdam Marathon",
    date: "2026-10-18",
    type: "marathon",
    city: "Amsterdam",
    province: "Noord-Holland",
    distances: ["7.5km", "21km", "42km"],
    paid: true,
    price: "€42.50–€141",
    atletiekunie: true,
    capacity: 32000,
    organizer: "Le Champion",
    description_nl: "De TCS Amsterdam Marathon 2026, start en finish in het Olympisch Stadion Amsterdam. Zondag 18 oktober: marathon (42,195 km, tot 32.000 lopers) en halve marathon. Zaterdag 17 oktober: 7,5 km, Kids Run en Heroes Run. Inschrijving opende 20 december 2025; marathon en halve marathon uitverkocht.",
    description_en: "The TCS Amsterdam Marathon 2026, start and finish in the Olympic Stadium Amsterdam. Sunday 18 October: marathon (42.195 km, up to 32,000 runners) and half marathon. Saturday 17 October: 7.5 km, Kids Run and Heroes Run. Opened 20 December 2025; marathon and half marathon sold out.",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
    registration_url: "https://www.tcsamsterdammarathon.eu/registration",
    youtube_url: ""
  },
  {
    id: 118,
    name_nl: "DSW Bruggenloop Rotterdam",
    name_en: "DSW Bridges Run Rotterdam",
    date: "2026-12-13",
    type: "wegevenement",
    city: "Rotterdam",
    province: "Zuid-Holland",
    distances: ["15km"],
    paid: true,
    price: "n.b.",
    atletiekunie: false,
    capacity: null,
    organizer: "DSW / Bruggenloop Rotterdam",
    description_nl: "De DSW Bruggenloop Rotterdam (15 km), start en finish bij De Kuip. De 2026-editie is volledig uitverkocht. Route loopt over de iconische Rotterdamse bruggen.",
    description_en: "The DSW Bridges Run Rotterdam (15 km), start and finish at De Kuip stadium. The 2026 edition is fully sold out. The route passes over Rotterdam's iconic bridges.",
    image: "https://images.unsplash.com/photo-1560073743-0a45abee4e02?w=800&q=80",
    registration_url: "https://bruggenloop.nl/inschrijven/",
    youtube_url: ""
  }
];

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
