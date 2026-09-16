// Haalt beide bronnen op voor alle 3 provincies, parset, dedupliceert, en toont een
// dry-run samenvatting. Schrijft NIETS naar Supabase.
import { collectEvents } from './lib/collectEvents.js'
import { printDryRunSummary } from './lib/dryRunSummary.js'
import { mapToSupabaseShape } from './lib/mapToSupabaseShape.js'

const { unique, duplicates } = await collectEvents({ year: 2026 })
printDryRunSummary(unique, duplicates)

console.log('\n=== Zo zouden de eerste 3 rijen in de Supabase "events"-tabel uitzien ===')
console.log('(nog steeds NIET geschreven — alleen ter controle)\n')
console.log(JSON.stringify(unique.slice(0, 3).map(mapToSupabaseShape), null, 2))
