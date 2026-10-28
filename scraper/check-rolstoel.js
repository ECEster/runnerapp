// Zoekt op de sites van organisatoren naar een rolstoel- of handbikecategorie
// en maakt een lijst met KANDIDATEN om met de hand na te lopen. Zet zelf niets
// in de database: zinnen als "niet geschikt voor rolstoelen" of "rolstoel-
// toegankelijke tribune" moeten door een mens beoordeeld worden.
//
// Per evenement: de inschrijflink ophalen, en als daar niets staat ook maximaal
// vier pagina's op dezelfde site die naar afstanden/inschrijven/reglement/info
// lijken te gaan. Elke URL wordt maar één keer opgehaald.
//
// Vereist dezelfde .env als write-events.js.
// Draaien:  node check-rolstoel.js            (alleen komende, nog niet aangevinkte events)
// Uitvoer:  .cache/rolstoel-kandidaten.json + een leesbaar overzicht in de terminal

try {
  process.loadEnvFile()
} catch {
  // geen .env — prima als de omgevingsvariabelen al gezet zijn
}

import { mkdirSync, writeFileSync } from 'node:fs'

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}` }

const KEYWORDS = /(rolstoel\w*|handbike\w*|hand-bike\w*|wheelchair\w*|framerun\w*|frame-run\w*|frame running|aangepast sporten|g-sport\w*|para-?atle\w*)/i
// Zinnen die op toegankelijkheid voor publiek of een verbod wijzen
const NEGATIVE = /(niet (toegestaan|geschikt|mogelijk)|geen (rolstoel|handbike)|verboden|toegankelijk|invalidentoilet|parkeerplaats|publiek|toeschouwers)/i
// Bronsites en inschrijfplatforms: daar staat geen informatie van de organisator
const SKIP_HOSTS = /(hardloopkalendernederland|runphy|loopjeloopje|facebook\.com|instagram\.com|google\.)/i
const SUBPAGE_HINT = /(afstand|inschrijv|reglement|info|deelnem|categor|wedstrijd|programma|faq|parcours|onderdel)/i

const pageCache = new Map()

async function fetchText(url) {
  if (pageCache.has(url)) return pageCache.get(url)
  let result = { text: '', links: [] }
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 12000)
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (RunningNederland.nl evenementencheck)' },
    })
    clearTimeout(t)
    const type = res.headers.get('content-type') || ''
    if (res.ok && type.includes('html')) {
      const html = await res.text()
      const links = [...html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({
        href: m[1],
        label: m[2].replace(/<[^>]+>/g, ' '),
      }))
      const text = html
        .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
      result = { text, links, finalUrl: res.url }
    }
  } catch {
    // onbereikbaar of te traag: overslaan
  }
  pageCache.set(url, result)
  return result
}

function findSnippets(text) {
  const out = []
  const re = new RegExp(KEYWORDS.source, 'gi')
  let m
  while ((m = re.exec(text)) && out.length < 3) {
    const start = Math.max(0, m.index - 90)
    const snippet = text.slice(start, m.index + m[0].length + 90).trim()
    out.push(snippet)
  }
  return out
}

async function checkEvent(ev) {
  const base = ev.registration_url
  if (!base || !/^https?:\/\//i.test(base) || SKIP_HOSTS.test(base)) return null
  const pages = [base]
  const first = await fetchText(base)
  let snippets = findSnippets(first.text).map((s) => ({ url: base, s }))
  if (!snippets.length && first.links.length) {
    let origin
    try { origin = new URL(first.finalUrl || base).origin } catch { origin = null }
    const sub = []
    for (const l of first.links) {
      let abs
      try { abs = new URL(l.href, first.finalUrl || base).href } catch { continue }
      if (!origin || !abs.startsWith(origin) || abs === base) continue
      if (!SUBPAGE_HINT.test(l.href + ' ' + l.label)) continue
      if (!sub.includes(abs)) sub.push(abs)
      if (sub.length >= 4) break
    }
    for (const u of sub) {
      pages.push(u)
      const p = await fetchText(u)
      snippets = snippets.concat(findSnippets(p.text).map((s) => ({ url: u, s })))
      if (snippets.length) break
    }
  }
  if (!snippets.length) return null
  const twijfel = snippets.every(({ s }) => NEGATIVE.test(s))
  return { id: ev.id, naam: ev.name_nl, datum: ev.date, plaats: ev.city, twijfel, snippets }
}

async function main() {
  if (!URL_BASE || !KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ontbreken (zie .env.example)')
  const today = new Date().toISOString().slice(0, 10)
  const res = await fetch(
    `${URL_BASE}/rest/v1/events?select=id,name_nl,date,city,registration_url&rolstoel=eq.false&date=gte.${today}&order=date`,
    { headers: HEADERS },
  )
  const events = await res.json()
  console.log(`${events.length} komende events zonder rolstoel-kenmerk; organisatorsites nalopen...`)

  const found = []
  let done = 0
  const queue = [...events]
  async function worker() {
    while (queue.length) {
      const ev = queue.shift()
      const r = await checkEvent(ev)
      if (r) found.push(r)
      if (++done % 100 === 0) console.log(`  ${done}/${events.length} bekeken, ${found.length} kandidaten`)
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))

  found.sort((a, b) => a.datum.localeCompare(b.datum))
  mkdirSync('.cache', { recursive: true })
  writeFileSync('.cache/rolstoel-kandidaten.json', JSON.stringify(found, null, 2))
  console.log(`\n${found.length} kandidaten (${found.filter((f) => f.twijfel).length} twijfelachtig):\n`)
  for (const f of found) {
    console.log(`[${f.twijfel ? 'TWIJFEL' : 'KANDIDAAT'}] id ${f.id} | ${f.naam} | ${f.datum} | ${f.plaats}`)
    for (const { url, s } of f.snippets) console.log(`    "...${s}..."\n     (${url})`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
