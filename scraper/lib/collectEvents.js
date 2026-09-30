// Haalt en parset events van alle drie bronnen, voor alle opgegeven
// provincies, en dedupliceert ze onderling (zie lib/dedupe.js voor de
// matchlogica).
import { fetchHtml } from './fetchPage.js'
import { parseRunphyEvents } from './parseRunphy.js'
import { parseHardloopkalenderEvents } from './parseHardloopkalender.js'
import { parseLoopjeLoopjeEvents } from './parseLoopjeLoopje.js'
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

export async function collectEvents({ year }) {
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
  persistProvinceCache()

  return dedupeEvents(allEvents)
}
