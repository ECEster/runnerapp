import { fetchHtml } from './lib/fetchPage.js'
import { parseHardloopkalenderEvents } from './lib/parseHardloopkalender.js'

const url = 'https://hardloopkalendernederland.nl/groningen/'
const html = await fetchHtml(url)

const events = parseHardloopkalenderEvents(html, {
  year: 2026,
  provincie: 'Groningen',
  bronUrl: url,
})

console.log(`${events.length} events gevonden op ${url}\n`)
console.log(JSON.stringify(events, null, 2))
