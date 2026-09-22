// Haalt en parset events van alle drie bronnen, voor alle opgegeven
// provincies, en dedupliceert ze onderling (zie lib/dedupe.js voor de
// matchlogica).
import { fetchHtml } from './fetchPage.js'
import { parseRunphyEvents } from './parseRunphy.js'
import { parseHardloopkalenderEvents } from './parseHardloopkalender.js'
import { parseLoopjeLoopjeEvents } from './parseLoopjeLoopje.js'
import { persistProvinceCache } from './resolveProvince.js'
import { dedupeEvents } from './dedupe.js'

const PROVINCES = ['groningen', 'friesland', 'drenthe']

export async function collectEvents({ year }) {
  const allEvents = []

  for (const provinceSlug of PROVINCES) {
    const runphyUrl = `https://runphy.nl/events/provinces/${provinceSlug}`
    const runphyHtml = await fetchHtml(runphyUrl)
    allEvents.push(...parseRunphyEvents(runphyHtml))

    const hknUrl = `https://hardloopkalendernederland.nl/${provinceSlug}/`
    const hknHtml = await fetchHtml(hknUrl)
    const provincie = provinceSlug.charAt(0).toUpperCase() + provinceSlug.slice(1)
    allEvents.push(
      ...parseHardloopkalenderEvents(hknHtml, { year, provincie, bronUrl: hknUrl }),
    )
  }

  // loopjeloopje.nl heeft geen aparte pagina per provincie (in tegenstelling
  // tot de twee bronnen hierboven) — één keer ophalen, zelf filteren op
  // Noord-Nederland (zie lib/parseLoopjeLoopje.js + lib/resolveProvince.js).
  const loopjeLoopjeHtml = await fetchHtml('https://www.loopjeloopje.nl/')
  allEvents.push(...(await parseLoopjeLoopjeEvents(loopjeLoopjeHtml)))
  persistProvinceCache()

  return dedupeEvents(allEvents)
}
