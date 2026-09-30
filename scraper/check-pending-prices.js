// Controleert of er evenementen zijn met prijs "volgt" die binnen ~4 maanden
// plaatsvinden, en schrijft een overzicht naar pending-prices-report.txt —
// leeg als er niets te melden is, anders een leesbare lijst met naam, datum
// en inschrijflink, bedoeld als inhoud van de geplande herinnerings-e-mail
// (zie .github/workflows/check-pending-prices.yml).
//
// Schrijft NOOIT naar de database — puur een signaleringsscript. Wél nodig:
// dezelfde SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY als write-events.js (zie
// .env.example), want prijs staat niet in de publieke (anon) API-selectie.
//
// Handmatig draaien: node check-pending-prices.js

try {
  process.loadEnvFile()
} catch {
  // geen .env gevonden — prima als de omgevingsvariabelen al gezet zijn (CI)
}

import { writeFileSync } from 'node:fs'
import { fetchEventsWithPendingPrice } from './lib/supabaseAdmin.js'

const MONTHS_AHEAD = 4
const REPORT_PATH = 'pending-prices-report.txt'

async function main() {
  const events = await fetchEventsWithPendingPrice()

  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() + MONTHS_AHEAD)

  const upcoming = events
    .filter((e) => {
      const d = new Date(e.date)
      return d >= now && d <= cutoff
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (upcoming.length === 0) {
    writeFileSync(REPORT_PATH, '')
    console.log(`Niets te melden: geen evenementen met prijs "volgt" binnen ${MONTHS_AHEAD} maanden.`)
    return
  }

  const lines = upcoming.map((e) => {
    const link = e.registration_url || e.source_url || 'geen link bekend'
    return `- ${e.name_nl} (${e.date}) — ${link}`
  })
  const report =
    `${upcoming.length} evenement(en) hebben nog "volgt" als prijs en vinden binnen ${MONTHS_AHEAD} maanden plaats — ` +
    `check de organisatorsite en werk de prijs bij in het admin-paneel:\n\n${lines.join('\n')}\n`

  writeFileSync(REPORT_PATH, report)
  console.log(report)
}

try {
  await main()
} catch (err) {
  console.error(`\n✗ Gestopt door een fout: ${err.message}`)
  process.exitCode = 1
}
