// Haalt en parset events van beide bronnen, voor alle opgegeven provincies, en
// dedupliceert ze onderling (zie lib/dedupe.js voor de matchlogica).
import { fetchHtml } from './fetchPage.js'
import { parseRunphyEvents } from './parseRunphy.js'
import { parseHardloopkalenderEvents } from './parseHardloopkalender.js'
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

  return dedupeEvents(allEvents)
}
