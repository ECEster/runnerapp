// Haalt en parset events van alle drie bronnen, voor alle opgegeven
// provincies, en dedupliceert ze onderling (zie lib/dedupe.js voor de
// matchlogica).
import { fetchHtml } from './fetchPage.js'
import { parseRunphyEvents } from './parseRunphy.js'
import { parseHardloopkalenderEvents } from './parseHardloopkalender.js'
import { parseLoopjeLoopjeEvents } from './parseLoopjeLoopje.js'
import { collectInschrijvenEvents } from './parseInschrijven.js'
import { collectHardlopenEvents } from './parseHardlopen.js'
import { persistProvinceCache } from './resolveProvince.js'
import { dedupeEvents } from './dedupe.js'

// Alle 12 provincies. De twee bronnen schrijven de URL-slug verschillend:
// runphy.nl met koppelteken ("noord-brabant"), hardloopkalendernederland.nl
// zonder ("noordbrabant"). 'naam' is de schrijfwijze die de rest van de site
// gebruikt (zie REGIO_MAP in admin-panel.html).
const PROVINCES = [
  { naam: 'Groningen', runphy: 'groningen', hkn: 'groningen' },
  { naam: 'Friesland', runphy: 'friesland', hkn: 'friesland' },
  { naam: 'Drenthe', runphy: 'drenthe', hkn: 'drenthe' },
  { naam: 'Overijssel', runphy: 'overijssel', hkn: 'overijssel' },
  { naam: 'Flevoland', runphy: 'flevoland', hkn: 'flevoland' },
  { naam: 'Gelderland', runphy: 'gelderland', hkn: 'gelderland' },
  { naam: 'Utrecht', runphy: 'utrecht', hkn: 'utrecht' },
  { naam: 'Noord-Holland', runphy: 'noord-holland', hkn: 'noordholland' },
  { naam: 'Zuid-Holland', runphy: 'zuid-holland', hkn: 'zuidholland' },
  { naam: 'Zeeland', runphy: 'zeeland', hkn: 'zeeland' },
  { naam: 'Noord-Brabant', runphy: 'noord-brabant', hkn: 'noordbrabant' },
  { naam: 'Limburg', runphy: 'limburg', hkn: 'limburg' },
]

// vanaf/tot (JJJJ-MM-DD, optioneel): alleen gebruikt voor inschrijven.nl,
// dat per evenement een pagina moet ophalen — zo blijven dat er niet meer
// dan nodig.
export async function collectEvents({ year, vanaf, tot }) {
  const allEvents = []

  for (const { naam: provincie, runphy, hkn } of PROVINCES) {
    const runphyUrl = `https://runphy.nl/events/provinces/${runphy}`
    const runphyHtml = await fetchHtml(runphyUrl)
    allEvents.push(...parseRunphyEvents(runphyHtml))

    const hknUrl = `https://hardloopkalendernederland.nl/${hkn}/`
    const hknHtml = await fetchHtml(hknUrl)
    allEvents.push(
      ...parseHardloopkalenderEvents(hknHtml, { year, provincie, bronUrl: hknUrl }),
    )
  }

  // loopjeloopje.nl heeft geen aparte pagina per provincie (in tegenstelling
  // tot de twee bronnen hierboven) — één keer ophalen, en via PDOK per plaats
  // de provincie bepalen (zie lib/parseLoopjeLoopje.js + lib/resolveProvince.js).
  const loopjeLoopjeHtml = await fetchHtml('https://www.loopjeloopje.nl/')
  allEvents.push(...(await parseLoopjeLoopjeEvents(loopjeLoopjeHtml)))

  // inschrijven.nl als laatste: bij een dubbel met een van de bronnen
  // hierboven blijft het event van die bron staan (zie lib/dedupe.js), zodat
  // bestaande series hetzelfde blijven. Zie lib/parseInschrijven.js.
  allEvents.push(...(await collectInschrijvenEvents(fetchHtml, { vanaf, tot })))
  // hardlopen.nl (kalender van de Atletiekunie) als vijfde bron, ook achteraan:
  // vult vooral crossen, parkruns en clubwedstrijden aan die de andere bronnen
  // missen. Zie lib/parseHardlopen.js.
  try {
    allEvents.push(...(await collectHardlopenEvents(fetchHtml, { vanaf, tot })))
  } catch (err) {
    // Een storing bij hardlopen.nl mag de andere vier bronnen niet tegenhouden
    console.warn(`  hardlopen.nl overgeslagen: ${err.message}`)
  }
  persistProvinceCache()

  return dedupeEvents(allEvents)
}
