// Parser voor inschrijven.nl — het inschrijfplatform dat veel organisatoren
// gebruiken. Werkt in twee stappen:
//
// 1. De lijst: de voorpagina zet alle evenementen als JSON in de pagina
//    (`const events=[{"id":"2026110713263","nm":"Vestingstadrun",
//    "pl":"Sleeuwijk","ln":"NED","wd":"zaterdag","dt":"7 NOV 2026"}, ...]`).
//    Een POST met type=l geeft alleen de loopevenementen (zonder type staan
//    er ook fiets-, mountainbike- en andere wedstrijden tussen).
// 2. Per evenement het inschrijfformulier (/form/<id>-nl): daar staan de
//    onderdelen als <option>s ("5 km", "Halve Marathon", "Jeugd 8-9 jr") en
//    soms een voorwoord van de organisator met het inschrijfgeld.
//
// AANNAMES:
// - Alleen ln === 'NED' (er staan ook Belgische en Duitse evenementen op).
// - Competities en circuits (meerdere wedstrijden onder één naam, zoals
//   "Zeeuwse Crosscompetitie" met plaats "Zeeland") slaan we over: dat is
//   geen los evenement op één dag en plek.
// - De provincie komt, net als bij loopjeloopje.nl, uit PDOK via de
//   plaatsnaam (lib/resolveProvince.js). Lukt dat niet, dan valt het
//   evenement af — liever niets dan een evenement zonder regio.
// - Afstanden: alleen onderdelen waar een afstand in staat; "Halve
//   Marathon"/"Marathon"/"Kwart marathon" worden 21.1/42.2/10.5 km. Een
//   jeugd-/kidsonderdeel wordt "Kidsrun 1 km" (of "Kidsrun" zonder afstand),
//   zodat lib/detectKidsrun.js het herkent, net als bij runphy.nl.
// - Het inschrijfgeld staat meestal pas in de volgende stap van het
//   formulier (na het kiezen van een onderdeel). Die stap zetten we bewust
//   NIET: dan zou het programma inschrijvingen starten. Alleen als de
//   organisator het bedrag in het voorwoord zet, nemen we het mee — als
//   VOORSTEL (price_suggestion), net als scraper/suggest-prices.js.

import { resolveProvince } from './resolveProvince.js'
import { extractPrice } from './extractPrice.js'

const BASE = 'https://inschrijven.nl'
const MONTHS = { JAN: 1, FEB: 2, MRT: 3, APR: 4, MEI: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OKT: 10, NOV: 11, DEC: 12 }
const LEADING_ORDINAL_RE = /^\d{1,3}(?:e|de|ste)\s+/i
const SKIP_NAME_RE = /competitie|circuit\s*$/i
const NO_PLACE_RE = /meerdere|diverse|verschillende|div\.|nader te bepalen|n\.?t\.?b|online|virtueel|^(groningen|friesland|drenthe|overijssel|gelderland|flevoland|utrecht|noord-holland|zuid-holland|zeeland|noord-brabant|limburg|nederland)$/i
const KIDS_RE = /kids|kinder|jeugd|mini|pupil|benjamin|t\/m\s*1[0-5]\s*j|\b[4-9]\s*(?:-|t\/m)\s*1[0-5]\s*j/i
const PAUSE_MS = 1000

// "24 OKT 2026" -> "2026-10-24"
export function parseDatum(dt) {
  const m = String(dt || '').trim().match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/i)
  if (!m) return null
  const maand = MONTHS[m[2].toUpperCase()]
  return maand ? `${m[3]}-${String(maand).padStart(2, '0')}-${m[1].padStart(2, '0')}` : null
}

// De JSON-lijst uit de voorpagina
export function parseInschrijvenList(html) {
  const start = html.indexOf('const events=[')
  if (start === -1) return []
  const end = html.indexOf('];', start)
  try {
    return JSON.parse(html.slice(start + 'const events='.length, end + 1))
  } catch {
    return []
  }
}

function formatKm(km) {
  return `${Math.round(km * 1000) / 1000} km`
}

// Eén onderdeel ("Jeugd 4 t/m 6 jaar 800 m (09:35 uur)") -> "Kidsrun 0.8 km";
// null als er geen afstand in staat en het geen jeugdonderdeel is
export function onderdeelToAfstand(text) {
  const t = text.replace(/\([^)]*uur[^)]*\)/gi, ' ').replace(/\s+/g, ' ').trim()
  let km = null
  if (/halve\s+marathon|1\/2\s*marathon/i.test(t)) km = 21.1
  else if (/kwart\s+marathon|1\/4\s*marathon/i.test(t)) km = 10.5
  else if (/\bmarathon\b/i.test(t) && !/trainingsmarathon/i.test(t)) km = 42.2
  else {
    const kmMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(?:km|kilometer|k)\b/i)
    const mMatch = t.match(/(\d{2,5})\s*(?:m|meter)\b/i)
    const mijlMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(?:mijl|mile|miles)\b/i)
    if (kmMatch) km = parseFloat(kmMatch[1].replace(',', '.'))
    else if (mijlMatch) km = Math.round(parseFloat(mijlMatch[1].replace(',', '.')) * 1.60934 * 10) / 10
    else if (mMatch) km = Number(mMatch[1]) / 1000
  }
  if (km !== null && !(km > 0 && km < 400)) km = null
  const kids = KIDS_RE.test(t)
  if (kids) return km !== null ? `Kidsrun ${formatKm(km)}` : 'Kidsrun'
  return km !== null ? formatKm(km) : null
}

// Alle onderdelen van het inschrijfformulier -> unieke afstanden, kort naar lang
export function parseAfstanden(formHtml) {
  const opties = [...formHtml.matchAll(/<option value="\d+"[^>]*>([^<]*)/g)].map((m) => m[1])
  const afstanden = [...new Set(opties.map(onderdeelToAfstand).filter(Boolean))]
  const km = (a) => parseFloat((a.match(/[\d.]+/) || ['0'])[0])
  return afstanden.sort((a, b) => km(a) - km(b))
}

// Bepaalt de provincie; probeert bij "Nes - Ameland" of "Deventer - Bathmen"
// ook de losse delen. Geeft { plaats, provincie } of null.
async function resolvePlaats(pl) {
  const cleaned = pl.replace(/\ba\/d\b/i, 'aan den').trim()
  const kandidaten = [cleaned, ...cleaned.split(/\s+-\s+|,/).map((s) => s.trim())]
  for (const plaats of [...new Set(kandidaten)].filter(Boolean)) {
    const provincie = await resolveProvince(plaats)
    if (provincie) return { plaats, provincie }
  }
  return null
}

// Kandidaten uit de lijst, nog zonder netwerk: alleen Nederland, met een
// echte plaats en datum, geen competities
export function selectCandidates(list) {
  return list.filter(
    (e) => e.ln === 'NED' && parseDatum(e.dt) && e.pl && !NO_PLACE_RE.test(e.pl.trim()) && !SKIP_NAME_RE.test(e.nm || ''),
  )
}

export async function collectInschrijvenEvents(fetchHtml, { vanaf, tot } = {}) {
  const list = parseInschrijvenList(await fetchHtml(`${BASE}/`, { form: { type: 'l', zoek: '' } }))
  const candidates = selectCandidates(list).filter((e) => {
    const d = parseDatum(e.dt)
    return (!vanaf || d >= vanaf) && (!tot || d <= tot)
  })
  console.log(`  inschrijven.nl: ${list.length} loopevenementen, ${candidates.length} in Nederland in de periode`)

  const events = []
  for (const e of candidates) {
    const locatie = await resolvePlaats(e.pl)
    if (!locatie) continue
    const formUrl = `${BASE}/form/${e.id}-nl`
    let formHtml = ''
    try {
      formHtml = await fetchHtml(formUrl)
    } catch (err) {
      console.warn(`  ⚠️  ${formUrl}: ${err.message}`)
    }
    await new Promise((r) => setTimeout(r, PAUSE_MS)) // beleefd: één pagina per seconde
    const naamRuw = (e.nm || '').trim()
    const prijs = formHtml ? extractPrice(formHtml) : null
    events.push({
      naam: naamRuw.replace(LEADING_ORDINAL_RE, '') || null,
      naam_ruw: naamRuw || null,
      datum: parseDatum(e.dt),
      plaats: locatie.plaats,
      provincie: locatie.provincie,
      afstanden: formHtml ? parseAfstanden(formHtml) : [],
      organisator_url: formUrl,
      bron_url: formUrl,
      afbeelding_url: null,
      prijs_voorstel: prijs ? { ...prijs, url: formUrl } : null,
    })
  }
  return events
}
