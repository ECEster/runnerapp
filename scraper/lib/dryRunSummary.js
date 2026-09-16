import { normalize } from './dedupe.js'

// Print een samenvatting van wat er geschreven ZOU worden — schrijft niets.
export function printDryRunSummary(events, duplicates) {
  console.log(`\n=== DRY RUN: ${events.length} unieke events klaar om te controleren ===`)

  const byProvince = {}
  for (const event of events) {
    byProvince[event.provincie] = (byProvince[event.provincie] ?? 0) + 1
  }
  console.log('\nPer provincie:', byProvince)

  const missingPlaats = events.filter((e) => !e.plaats).length
  const missingDatum = events.filter((e) => !e.datum).length
  console.log(`Events zonder plaats: ${missingPlaats}`)
  console.log(`Events zonder datum: ${missingDatum}`)
  console.log(`Als duplicaat weggefilterd (datum+plaats, of naam+datum als plaats onbekend): ${duplicates.length}`)

  if (duplicates.length > 0) {
    console.log('\nWeggefilterde duplicaten (behouden vs. verwijderd — controleer op foute matches):')
    for (const { kept, removed } of duplicates) {
      const sameName = normalize(kept.naam) === normalize(removed.naam)
      const marker = sameName ? '' : '  <-- andere naam, controleren!'
      console.log(`  - behouden: "${kept.naam}" | verwijderd: "${removed.naam}" | ${removed.datum} | ${removed.plaats}${marker}`)
    }
  }

  console.log('\nEerste 10 events ter controle:')
  console.log(JSON.stringify(events.slice(0, 10), null, 2))
}
