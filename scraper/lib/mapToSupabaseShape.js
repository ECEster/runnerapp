import { detectKidsrun } from './detectKidsrun.js'
import { detectSurvivalrun } from './detectSurvivalrun.js'
import { buildSerie } from './buildSerie.js'
import { extractEditie } from './extractEditie.js'
import { decodeHtmlEntities } from './decodeHtmlEntities.js'

function titleCase(str) {
  if (!str) return str;
  return str.toLowerCase()
    .replace(/\b[a-zà-ÿ]/g, (c) => c.toUpperCase())
    .replace(/'[A-Z]/g, (m) => m.toLowerCase());
}

// Zet een afstandsstring van mijlen naar km als de eenheid "mi" of "mile(s)" is.
// Bijv. "5mi" → "8.0km", "13.1 miles" → "21.1km". Andere eenheden blijven ongewijzigd.
function normalizeerAfstand(afstand) {
  const match = afstand.match(/^(\d+(?:[.,]\d+)?)\s*mi(?:les?)?$/i);
  if (!match) return afstand;
  const mijlen = parseFloat(match[1].replace(',', '.'));
  const km = Math.round(mijlen * 1.60934 * 10) / 10;
  return `${km}km`;
}

// Zet ons interne event-formaat om naar de vorm van de bestaande 'events'-tabel.
//
// Aannames / bewuste keuzes:
// - published: altijd false — nieuwe events komen in een wachtrij, jij publiceert handmatig
//   vanuit het admin-portaal.
// - type: we kunnen dit meestal niet betrouwbaar afleiden uit de bronnen, dus krijgt het
//   voorlopig de placeholder 'wegevenement' — BEHALVE als de naam zelf al een obstakel-/
//   survivalrun verraadt (zie lib/detectSurvivalrun.js), dan wordt dat 'survivalrun', of
//   als er "trail" in de naam staat, dan wordt dat 'trail'. Omdat published:false is, staat
//   dit nooit ongecontroleerd live — je corrigeert het type zo nodig tijdens het reviewen.
// - kidsrun: alleen true als de bron zelf al iets kids-achtigs noemt in de naam of de
//   afstanden (zie lib/detectKidsrun.js). Kan een kidsrun missen die de bron niet vermeldt —
//   controleer dit sowieso tijdens het reviewen, net als 'type'.
// - organizer (organisatienaam, tekst) laten we leeg: we hebben alleen een URL, geen naam.
// - registration_url/source_url: HTML-entiteiten (bv. '&amp;') worden teruggezet naar gewone
//   tekens, voor alle bronnen (runphy.nl, hardloopkalendernederland.nl, loopjeloopje.nl) —
//   zie lib/decodeHtmlEntities.js.
// - distances: van array naar komma-string, zoals de rest van de tabel dat al doet.
// - source_url: NIEUWE kolom (nog toe te voegen via migratie), alleen voor het admin-portaal —
//   niet bedoeld om aan bezoekers te tonen.
// - serie/editie: NIEUWE kolommen (migratie 0002) — zie lib/buildSerie.js en
//   lib/extractEditie.js voor hoe deze worden afgeleid.
export function mapToSupabaseShape(event) {
  return {
    // Naam leesbaar maken (&amp; -> &); de serie blijft op de ruwe naam, zodat
    // bestaande rijen herkend blijven
    name_nl: decodeHtmlEntities(event.naam),
    date: event.datum,
    city: titleCase(event.plaats),
    province: event.provincie,
    distances: event.afstanden.map(normalizeerAfstand).join(', '),
    registration_url: decodeHtmlEntities(event.organisator_url),
    source_url: decodeHtmlEntities(event.bron_url),
    image: event.afbeelding_url,
    // hardlopen.nl geeft het soort evenement zelf mee; anders afleiden uit de naam
    type: event.type || (detectSurvivalrun(event) ? 'survivalrun' : /trail/i.test(event.naam) ? 'trail' : 'wegevenement'),
    organizer: event.organisator || null,
    atletiekunie: !!event.atletiekunie,
    // hardlopen.nl: laatste inschrijfdag en of na-inschrijving (op de dag zelf) kan
    registration_deadline: event.inschrijf_deadline || null,
    late_registration: event.na_inschrijving ?? null,
    // hardlopen.nl noemt het inschrijfgeld per afstand op de detailpagina
    ...(event.prijs && { price: event.prijs }),
    published: false,
    kidsrun: detectKidsrun(event),
    // Aangepast sporten (rolstoel, handbike, framerunning, G-atletiek), alleen als het in de naam staat
    rolstoel: /rolstoel|handbike|wheelchair|framerun|g-run|g-loop/i.test(event.naam || ''),
    serie: buildSerie({ naam: event.naam, plaats: event.plaats }),
    editie: extractEditie({ rawNaam: event.naam_ruw, datum: event.datum }),
    // Alleen inschrijven.nl levert soms een bedrag (lib/parseInschrijven.js) —
    // als voorstel, net als scraper/suggest-prices.js; de prijs zelf blijft leeg
    ...(event.prijs_voorstel && {
      price_suggestion: event.prijs_voorstel.price,
      price_suggestion_quote: event.prijs_voorstel.quote,
      price_suggestion_url: event.prijs_voorstel.url,
      price_checked_at: new Date().toISOString(),
    }),
  }
}
