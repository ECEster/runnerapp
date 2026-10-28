// Haalt events op, dedupliceert (onderling én tegen wat al in de database staat), en
// schrijft ze naar Supabase — MAAR ALLEEN als je --live meegeeft. Standaard is dit een
// dry-run die alleen print wat er zou gebeuren.
//
// Gebruik:
//   node write-events.js              # dry-run (standaard, veilig)
//   node write-events.js --live       # schrijft daadwerkelijk naar Supabase
//   node write-events.js --regio=oost # alleen nieuwe events in één regio (noord/oost/zuid/west)
//   node write-events.js --max=300    # veiligheidslimiet voor nieuwe events tijdelijk verhogen
//
// Vereist een .env met SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY (zie .env.example).

try {
  process.loadEnvFile()
} catch {
  // Geen .env gevonden — prima als de omgevingsvariabelen op een andere manier zijn
  // gezet (bv. door een geplande taak/CI). fetchExistingEventKeys/insertEventRow geven
  // zelf een duidelijke foutmelding als de variabelen alsnog ontbreken.
}

import { collectEvents } from './lib/collectEvents.js'
import { dedupeAgainstDb } from './lib/dedupeAgainstDb.js'
import { mapToSupabaseShape } from './lib/mapToSupabaseShape.js'
import { namesLikelyMatch } from './lib/nameSimilarity.js'
import { namesClearlyDifferent } from './lib/dedupe.js'
import { fetchExistingEventKeys, insertEventRow, updateEventFields } from './lib/supabaseAdmin.js'

const DEFAULT_MAX_INSERTS = 50

// Bewust verwijderde fouten van de bronsites: nooit opnieuw toevoegen.
// Sleutel = serie|datum (zoals in de database).
const IGNORE = new Set([
  'zevenheuvelenloop-nijmegen|2026-11-14', // bronsite zet de loop op de dag van de Zevenheuvelennacht
  'zevenheuvelenloop-nijmegem|2026-11-15', // dubbel van 'NN Zevenheuvelenloop Nijmegen', met typfout
  'alfa-laval-stevensloop-nijmegen|2027-03-20', // bronsite geeft 20 maart; is 21 maart (rij 512 met de hand aangepast)
  'stevensloop-nijmegen|2027-03-21', // dubbel van 'Alfa Laval Stevensloop'
])

const REGIOS = {
  noord: ['Groningen', 'Friesland', 'Drenthe'],
  oost: ['Overijssel', 'Gelderland', 'Flevoland'],
  zuid: ['Noord-Brabant', 'Limburg'],
  west: ['Noord-Holland', 'Zuid-Holland', 'Utrecht', 'Zeeland'],
}

function argValue(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`))
  return arg ? arg.slice(name.length + 3).trim() : ''
}

const isLive = process.argv.includes('--live')
// Lege waarde of "alle" = geen regiofilter
const regio = argValue('regio').toLowerCase()
const regioProvincies = regio && regio !== 'alle' ? REGIOS[regio] : null
// Bewust te verhogen per run (bv. voor de eerste import van een nieuwe regio)
const MAX_INSERTS_PER_RUN = Number.parseInt(argValue('max'), 10) || DEFAULT_MAX_INSERTS
// Periode (JJJJ-MM-DD): standaard vanaf vandaag t/m 31 december van volgend jaar
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s)
const VANAF = isDate(argValue('vanaf')) ? argValue('vanaf') : new Date().toISOString().slice(0, 10)
const TOT = isDate(argValue('tot')) ? argValue('tot') : `${new Date().getFullYear() + 1}-12-31`

async function main() {
  console.log(isLive ? '=== LIVE MODUS — er wordt echt geschreven ===' : '=== DRY RUN (standaard, niets wordt geschreven) ===')
  if (regio && regio !== 'alle' && !regioProvincies) {
    throw new Error(`Onbekende regio "${regio}". Kies uit: alle, ${Object.keys(REGIOS).join(', ')}.`)
  }
  console.log(`Regio: ${regioProvincies ? `${regio} (${regioProvincies.join(', ')})` : 'alle'} | max. nieuwe events: ${MAX_INSERTS_PER_RUN}`)
  console.log(`Periode: ${VANAF} t/m ${TOT}`)

  console.log('\nStap 1/4: events ophalen en parsen van beide bronnen...')
  const { unique, duplicates } = await collectEvents({ year: new Date().getFullYear() })
  console.log(`  ${unique.length} unieke events gevonden (${duplicates.length} onderlinge duplicaten weggefilterd)`)

  console.log('\nStap 2/4: bestaande events in Supabase ophalen voor dedupliceer-check...')
  const existingRows = await fetchExistingEventKeys()
  console.log(`  ${existingRows.length} events staan al in de database`)

  const deduped = dedupeAgainstDb(unique, existingRows)
  // Regiofilter pas ná het dedupliceren, zodat de vergelijking met de database volledig blijft
  // Regio- en periodefilter pas ná het dedupliceren, zodat de vergelijking met de database volledig blijft
  const inPeriode = (e) => !e.datum || (e.datum >= VANAF && e.datum <= TOT)
  const inRegio = (e) => (!regioProvincies || regioProvincies.includes(e.provincie)) && inPeriode(e)
  const buitenPeriode = deduped.toInsert.filter((e) => !inPeriode(e)).length
  if (buitenPeriode) console.log(`  ${buitenPeriode} nieuwe events vallen buiten de periode en worden overgeslagen`)
  const notIgnored = (e) => {
    const row = mapToSupabaseShape(e)
    return !IGNORE.has(`${row.serie}|${row.date}`)
  }
  const ignored = deduped.toInsert.filter((e) => inRegio(e) && !notIgnored(e)).length
  if (ignored) console.log(`  ${ignored} bewust uitgesloten events overgeslagen (zie IGNORE)`)
  const candidates = deduped.toInsert.filter((e) => inRegio(e) && notIgnored(e))

  // Extra check tegen de database én tussen de nieuwe events onderling: zelfde datum en
  // sterk overeenkomende naam = hetzelfde evenement, ook als de bronnen een andere plaats
  // noemen (bv. Blaauwbek Marathon "Blauwestad" vs "Oostwold"). Eén dag verschil wordt
  // alleen gemeld: dan spreken de bronsites elkaar tegen en moet iemand kijken.
  // Zelfde provincie is een voorwaarde: algemene namen ("Nieuwjaarsloop", "Sylvesterloop")
  // komen in heel het land voor.
  const sameEvent = (a, b) =>
    (!a.prov || !b.prov || a.prov === b.prov) &&
    namesLikelyMatch(a.name, b.name) && !namesClearlyDifferent(a.name, b.name)
  const known = existingRows.map((r) => ({ name: r.name_nl, date: r.date, prov: r.province, label: `id ${r.id}` }))
  const dayDiff = (a, b) => Math.abs((new Date(a) - new Date(b)) / 86400000)
  const toInsert = []
  const fuzzySkipped = []
  const oneDayOff = []
  for (const e of candidates) {
    const me = { name: e.naam, date: e.datum, prov: e.provincie }
    const same = known.find((k) => k.date === e.datum && sameEvent(me, k))
    if (same) { fuzzySkipped.push(`${e.naam} | ${e.datum} | ${e.plaats} = ${same.name} (${same.label})`); continue }
    const near = known.find((k) => k.date && e.datum && dayDiff(k.date, e.datum) === 1 && sameEvent(me, k))
    if (near) oneDayOff.push(`${e.naam} | ${e.datum} | ${e.plaats}  <->  ${near.name} | ${near.date} (${near.label})`)
    toInsert.push(e)
    known.push({ name: e.naam, date: e.datum, prov: e.provincie, label: 'nieuw' })
  }
  if (fuzzySkipped.length) {
    console.log(`  ${fuzzySkipped.length} nieuwe events overgeslagen: zelfde datum en naam als een bestaand event (andere plaatsnaam):`)
    fuzzySkipped.forEach((l) => console.log(`    - ${l}`))
  }
  if (oneDayOff.length) {
    console.log(`  LET OP: ${oneDayOff.length} nieuwe events lijken op een event één dag eerder/later (bronnen spreken elkaar tegen):`)
    oneDayOff.forEach((l) => console.log(`    - ${l}`))
  }
  const toMerge = deduped.toMerge.filter(({ event }) => inRegio(event))
  const skipped = deduped.skipped.filter(inRegio)
  console.log(
    `\nStap 3/4: ${toInsert.length} nieuw, ${toMerge.length} aan te vullen, ${skipped.length} overgeslagen (al compleet)`,
  )

  if (toMerge.length > 0) {
    console.log('\nAan te vullen (bestaande rij, alleen lege velden):')
    for (const { event, existingId, fillable } of toMerge) {
      console.log(`  - id ${existingId}: ${event.naam} | ${event.datum} | velden: ${Object.keys(fillable).join(', ')}`)
    }
  }

  if (skipped.length > 0) {
    console.log('\nOvergeslagen (bestaan al, niets aan te vullen):')
    for (const e of skipped) {
      console.log(`  - ${e.naam} | ${e.datum} | ${e.plaats}`)
    }
  }

  if (toInsert.length > MAX_INSERTS_PER_RUN) {
    console.error(
      `\n⚠️  STOP: deze run zou ${toInsert.length} nieuwe events wegschrijven — dat is meer dan de ` +
        `veiligheidslimiet van ${MAX_INSERTS_PER_RUN}. Dit is een signaal dat er mogelijk iets mis is met ` +
        `een parser (bv. een bron die een heel andere pagina teruggeeft). Er is niets geschreven.\n` +
        `Controleer de output hierboven; verhoog MAX_INSERTS_PER_RUN in write-events.js pas nadat je hebt ` +
        `bevestigd dat de data klopt.`,
    )
    process.exitCode = 1
    return
  }

  console.log(
    `\nStap 4/4: ${toInsert.length} nieuwe rijen en ${toMerge.length} aanvullingen ` +
      `${isLive ? 'schrijven naar' : 'die geschreven zouden worden naar'} Supabase`,
  )

  if (!isLive) {
    console.log('\n(dry-run — geen --live vlag meegegeven, er wordt niets geschreven)\n')
    console.log('Nieuwe rijen (published: false):')
    console.log(JSON.stringify(toInsert.map(mapToSupabaseShape), null, 2))
    console.log('\nAanvullingen op bestaande rijen:')
    console.log(JSON.stringify(toMerge.map(({ existingId, fillable }) => ({ existingId, fillable })), null, 2))
    return
  }

  let inserted = 0
  let updated = 0
  let failed = 0

  for (const event of toInsert) {
    const row = mapToSupabaseShape(event)
    try {
      const result = await insertEventRow(row)
      inserted++
      console.log(`  ✓ toegevoegd (id ${result.id}): ${row.name_nl} | ${row.date} | ${row.city}`)
    } catch (err) {
      failed++
      console.error(`  ✗ MISLUKT (toevoegen): ${row.name_nl} | ${row.date} | ${row.city} — ${err.message}`)
    }
  }

  for (const { event, existingId, fillable } of toMerge) {
    try {
      await updateEventFields(existingId, fillable)
      updated++
      console.log(`  ✓ aangevuld (id ${existingId}): ${event.naam} | ${event.datum} | velden: ${Object.keys(fillable).join(', ')}`)
    } catch (err) {
      failed++
      console.error(`  ✗ MISLUKT (aanvullen): id ${existingId} — ${err.message}`)
    }
  }

  console.log(
    `\nKlaar. ${inserted} toegevoegd, ${updated} aangevuld, ${failed} mislukt, ${skipped.length} overgeslagen (bestonden al compleet).`,
  )
  if (inserted > 0) {
    console.log('Alle nieuwe rijen staan met published: false — controleer en publiceer ze in het admin-portaal.')
  }
}

try {
  await main()
} catch (err) {
  console.error(`\n✗ Gestopt door een fout: ${err.message}`)
  process.exitCode = 1
}
