// Stap 5: haal loopjeloopje.nl op, parse 'm, filter op Noord-Nederland (via
// PDOK) en toon de eerste 5 gevonden events zodat we kunnen controleren of
// het klopt.
import { fetchHtml } from './lib/fetchPage.js'
import { parseLoopjeLoopjeEvents } from './lib/parseLoopjeLoopje.js'
import { persistProvinceCache } from './lib/resolveProvince.js'

const url = 'https://www.loopjeloopje.nl/'

const html = await fetchHtml(url)
const events = await parseLoopjeLoopjeEvents(html)
persistProvinceCache()

console.log(`${events.length} Noord-Nederlandse events gevonden op ${url}\n`)
console.log(JSON.stringify(events.slice(0, 5), null, 2))
