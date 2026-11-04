// Parser voor hardlopen.nl — de hardloopkalender van de Atletiekunie.
//
// 1. De lijst: /evenementen/?page=N (10 per pagina, ± 40 pagina's). Per
//    evenement: datum, naam, soort (Wegevenement, Cross, Parkloop, ...),
//    plaats, afstanden (tooltip) en of het is aangesloten bij de Atletiekunie.
// 2. Per evenement de detailpagina: afstanden met categorie (Jeugd, Mannen,
//    Vrouwen) en inschrijfgeld per afstand, de organisatie en het startadres.
//
// AANNAMES:
// - "Trainingsloop" slaan we over: dat zijn clubtrainingen (bv. een
//   hazenloop bij een atletiekvereniging), geen evenementen voor iedereen.
// - Parkruns (soort Parkloop met "parkrun" in de naam) zijn gratis.
// - De prijs komt van de detailpagina (laagste - hoogste bedrag, jeugd
//   inbegrepen), dus geen voorstel maar de prijs zelf; nieuwe events staan
//   sowieso als concept in het admin-paneel.
// - registration_url wordt de detailpagina op hardlopen.nl: de site van de
//   organisator staat daar niet bij.
// - De provincie komt uit PDOK via de plaats (lib/resolveProvince.js); lukt
//   dat niet, dan valt het evenement af.

import { resolveProvince } from './resolveProvince.js'

const BASE = 'https://www.hardlopen.nl'
const MONTHS = { jan: 1, feb: 2, mrt: 3, apr: 4, mei: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12 }
const MAX_PAGES = 80
const PAUSE_MS = 500

// Soort op hardlopen.nl -> type in onze database
const TYPES = {
  wegevenement: 'wegevenement', cross: 'cross', trailrun: 'trail', parkloop: 'parkloop',
  funrun: 'funrun', survivalrun: 'survivalrun', ultrarun: 'ultrarun', coopertest: 'coopertest',
  'sportief wandelen': 'sportief wandelen', baanwedstrijd: 'baanevenement', baanloop: 'baanevenement',
  estafette: 'estafette', marathon: 'marathon',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// hardlopen.nl geeft soms even een HTTP 5xx (bv. 521 bij drukte): tot 3 keer
// opnieuw proberen, met steeds langer wachten
async function fetchRetry(fetchHtml, url) {
  for (let poging = 1; ; poging++) {
    try {
      return await fetchHtml(url)
    } catch (err) {
      if (poging >= 3) throw err
      await sleep(poging * 5000)
    }
  }
}

function text(html) {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&euro;/g, '€')
    .replace(/\s+/g, ' ')
    .trim()
}

// "5,50 km" -> "5.5km"
function kmLabel(s) {
  const m = /(\d+(?:,\d+)?)\s*km/i.exec(s)
  if (!m) return null
  return `${parseFloat(m[1].replace(',', '.'))}km`
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',')
}

export function parseHardlopenList(html) {
  const items = []
  // Elk evenement is een <a href="..." class="vertical-list-item ...">
  const parts = html.split(/<a href="(https:\/\/www\.hardlopen\.nl\/evenementen\/\d+-[^"]*)"\s+class="vertical-list-item /)
  for (let i = 1; i < parts.length; i += 2) {
    const url = [null, parts[i]]
    const chunk = parts[i + 1]
    const day = /date__day">(\d+)/.exec(chunk)
    const mon = /date__month hide-sm-down">(\w+) (\d{4})/.exec(chunk)
    const name = /content__title">\s*<span>([\s\S]*?)<\/span>/.exec(chunk)
    if (!day || !mon || !name || !MONTHS[mon[1].toLowerCase()]) continue
    const soort = /icon-run"><\/use>\s*<\/svg>\s*<div>\s*<span>([^<]*)<\/span>/.exec(chunk)
    const plaats = /icon-location"><\/use>\s*<\/svg>\s*<span>([^<]*)<\/span>/.exec(chunk)
    const afst = /data-tippy-content="([^"]*\bkm\b[^"]*)"/.exec(chunk)
    items.push({
      naam: text(name[1]),
      datum: `${mon[2]}-${String(MONTHS[mon[1].toLowerCase()]).padStart(2, '0')}-${day[1].padStart(2, '0')}`,
      soort: soort ? text(soort[1]) : '',
      plaats: plaats ? text(plaats[1]) : null,
      afstanden: afst ? afst[1].split(' - ').map(kmLabel).filter(Boolean) : [],
      atletiekunie: chunk.includes('Aangesloten bij de Atletiekunie'),
      url: url ? url[1] : null,
    })
  }
  return items
}

// Detailpagina: afstanden met categorie en prijs, organisatie, startplaats
export function parseHardlopenDetail(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
  const lines = body.split(/<[^>]+>/).map(text).filter(Boolean)
  const start = lines.indexOf('Afstanden')
  const end = lines.findIndex((l, i) => i > start && /^(Accommodatie|Contact & locatie)$/.test(l))
  const onderdelen = []
  if (start !== -1) {
    for (const line of lines.slice(start + 1, end === -1 ? undefined : end)) {
      if (/^\d+(?:,\d+)?\s*km$/i.test(line)) onderdelen.push({ km: kmLabel(line), jeugd: false, prijs: null })
      else if (!onderdelen.length) continue
      else if (/jeugd|kinder|kids|pupil|junior/i.test(line)) onderdelen[onderdelen.length - 1].jeugd = true
      else {
        const eur = /^€\s*([\d.]+,\d{2}|\d+)/.exec(line)
        if (eur) onderdelen[onderdelen.length - 1].prijs = parseFloat(eur[1].replace(/\./g, '').replace(',', '.'))
      }
    }
  }
  const org = lines.indexOf('Organisatie:')
  const adres = lines.indexOf('Adres start:')
  // Postcode + plaats, bv. "8801 ET Franeker"
  const plaatsRegel = adres !== -1 ? lines.slice(adres + 1, adres + 4).find((l) => /^\d{4}\s?[A-Z]{2}\s+\S/.test(l)) : null
  // "Inschrijving gesloten:" -> "zondag, 01 nov 2026"; "Na-inschrijving toegestaan?" -> "Ja"/"Nee"
  const sluit = lines.indexOf('Inschrijving gesloten:')
  const sluitDatum = sluit !== -1 ? /(\d{1,2}) (\w{3}) (\d{4})/.exec(lines[sluit + 1] || '') : null
  const na = lines.indexOf('Na-inschrijving toegestaan?')
  const naWaarde = na !== -1 ? (lines[na + 1] || '').toLowerCase() : ''
  return {
    onderdelen,
    deadline: sluitDatum && MONTHS[sluitDatum[2].toLowerCase()]
      ? `${sluitDatum[3]}-${String(MONTHS[sluitDatum[2].toLowerCase()]).padStart(2, '0')}-${sluitDatum[1].padStart(2, '0')}`
      : null,
    naInschrijving: naWaarde === 'ja' ? true : naWaarde === 'nee' ? false : null,
    organisatie: org !== -1 && lines[org + 1] && !/:$/.test(lines[org + 1]) ? lines[org + 1] : null,
    plaats: plaatsRegel ? plaatsRegel.replace(/^\d{4}\s?[A-Z]{2}\s+/, '') : null,
  }
}

function prijsUit(onderdelen, naam) {
  const bedragen = onderdelen.map((o) => o.prijs).filter((p) => p !== null)
  if (/parkrun/i.test(naam)) return 'gratis'
  if (!bedragen.length) return null
  const lo = Math.min(...bedragen)
  const hi = Math.max(...bedragen)
  if (hi === 0) return 'gratis'
  return lo === hi ? fmt(lo) : `${fmt(lo)} - ${fmt(hi)}`
}

// Alle evenementen van hardlopen.nl in ons interne formaat (zie
// lib/mapToSupabaseShape.js), met extra velden: type, atletiekunie, prijs,
// organisator.
export async function collectHardlopenEvents(fetchHtml, { vanaf, tot } = {}) {
  const lijst = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    let html
    try {
      html = await fetchRetry(fetchHtml, `${BASE}/evenementen/?page=${page}`)
    } catch (err) {
      // Blijft een pagina onbereikbaar, ga dan verder met wat we al hebben
      console.warn(`  hardlopen.nl: pagina ${page} niet bereikbaar (${err.message}), verder met ${lijst.length} evenementen`)
      break
    }
    const items = parseHardlopenList(html)
    if (!items.length) break
    lijst.push(...items)
    await sleep(PAUSE_MS)
  }

  const result = []
  for (const item of lijst) {
    if (/^trainingsloop$/i.test(item.soort)) continue
    if ((vanaf && item.datum < vanaf) || (tot && item.datum > tot)) continue
    let detail = { onderdelen: [], organisatie: null, plaats: null, deadline: null, naInschrijving: null }
    if (item.url) {
      try {
        detail = parseHardlopenDetail(await fetchRetry(fetchHtml, item.url))
      } catch {
        // detailpagina niet bereikbaar: verder met de gegevens uit de lijst
      }
      await sleep(PAUSE_MS)
    }
    const plaats = item.plaats || detail.plaats
    if (!plaats) continue
    const provincie = await resolveProvince(plaats)
    if (!provincie) continue
    const afstanden = detail.onderdelen.length
      ? detail.onderdelen.filter((o) => o.km).map((o) => (o.jeugd ? `Kidsrun ${o.km}` : o.km))
      : item.afstanden
    result.push({
      naam: item.naam,
      naam_ruw: item.naam,
      datum: item.datum,
      plaats,
      provincie,
      afstanden,
      organisator_url: item.url,
      bron_url: item.url,
      afbeelding_url: null,
      type: TYPES[item.soort.toLowerCase()] || null,
      atletiekunie: item.atletiekunie,
      prijs: prijsUit(detail.onderdelen, item.naam),
      organisator: detail.organisatie,
      inschrijf_deadline: detail.deadline,
      na_inschrijving: detail.naInschrijving,
    })
  }
  return result
}
