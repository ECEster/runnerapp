// Stap 3: haal de Groningen-pagina op, parse 'm, en toon de eerste 5 events
// zodat we kunnen controleren of het klopt voordat we verder gaan.
import { fetchHtml } from './lib/fetchPage.js'
import { parseRunphyEvents } from './lib/parseRunphy.js'

const url = 'https://runphy.nl/events/provinces/groningen'

const html = await fetchHtml(url)
const events = parseRunphyEvents(html)

console.log(`${events.length} events gevonden op ${url}\n`)
console.log(JSON.stringify(events.slice(0, 5), null, 2))
