// Zoekt de provincie van een Nederlandse plaatsnaam op via de PDOK
// Locatieserver — de gratis, publieke geocodeservice van de Nederlandse
// overheid, gebaseerd op de BAG (Basisregistratie Adressen en Gebouwen).
// Dit is de officiële, authoritatieve bron voor plaatsnaam -> provincie,
// in plaats van een handmatig getypte lijst (die we eerder overwogen —
// zie de git-historie voor de afgeschoten opzet).
//
// Waarom nodig: loopjeloopje.nl heeft, anders dan runphy.nl en
// hardloopkalendernederland.nl, geen aparte pagina per provincie — het is
// één landelijke lijst. lib/collectEvents.js verzamelt alleen
// Groningen/Friesland/Drenthe, dus moeten we zelf per plaatsnaam de
// provincie bepalen om te kunnen filteren.
//
// Documentatie PDOK Locatieserver: https://www.pdok.nl/restful-api/-/article/locatieserver

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE_PATH = `${__dirname}/../.cache/pdok-provinces.json`

// Bekende gevallen waar de rechtstreekse opzoeking niet (goed) werkt:
// - Verouderde/alternatieve spelling die PDOK niet als woonplaats kent
//   (bv. "Bergum", de oudere spelling van het officiële "Burgum").
// - Een eilandnaam die zelf de GEMEENTE is, geen woonplaats — we zoeken dan
//   op een hoofdkern van dat eiland als stand-in (elke kern op hetzelfde
//   eiland zit toch in dezelfde provincie/gemeente).
const PLACE_ALIASES = new Map([
  ['bergum', 'Burgum'],
  ['ameland', 'Hollum'],
  ['terschelling', 'West-Terschelling'],
  ['ter schelling', 'West-Terschelling'],
  ['terschelling-west', 'West-Terschelling'],
])

// PDOK gebruikt de officiële Friese provincienaam; de rest van deze site
// (zie REGIO_MAP in admin-panel.html, en de provincie-dropdowns) gebruikt
// het Nederlandse "Friesland". Vertalen voor consistentie.
const PROVINCE_NAME_MAP = new Map([['Fryslân', 'Friesland']])

function loadCache() {
  if (!existsSync(CACHE_PATH)) return {}
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

function saveCache(cache) {
  mkdirSync(dirname(CACHE_PATH), { recursive: true })
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
}

const cache = loadCache()
let cacheDirty = false

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function queryPdok(placeName, type) {
  const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(placeName)}&fq=type:${type}&rows=1`
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`PDOK Locatieserver HTTP ${res.status}`)
  const data = await res.json()
  const doc = data.response?.docs?.[0]
  if (!doc?.provincienaam) return null
  return PROVINCE_NAME_MAP.get(doc.provincienaam) ?? doc.provincienaam
}

// Zoekt de provincie op voor één plaatsnaam. Geeft null terug als er geen
// match is, of als PDOK niet bereikbaar is (dan NIET gecached, zodat een
// volgende run het opnieuw probeert in plaats van een tijdelijke storing
// permanent te onthouden als "geen match").
export async function resolveProvince(rawPlaceName) {
  if (!rawPlaceName) return null
  const key = rawPlaceName.trim().toLowerCase()
  if (key in cache) return cache[key]

  const lookupName = PLACE_ALIASES.get(key) ?? rawPlaceName.trim()

  let province
  try {
    province = (await queryPdok(lookupName, 'woonplaats')) ?? (await queryPdok(lookupName, 'gemeente'))
  } catch (err) {
    console.warn(`  ⚠️  PDOK-opzoeking voor "${rawPlaceName}" mislukt: ${err.message}`)
    return null
  }

  cache[key] = province
  cacheDirty = true
  // Kleine, beleefde pauze — alleen bij een echte netwerkopvraging (niet bij
  // cache-hits), zodat we de gratis overheidsservice niet onnodig belasten.
  await sleep(80)
  return province
}

// Schrijft de cache (nieuwe opzoekingen sinds het laatste schrijfmoment) naar
// schijf. Roep dit aan het eind van een scraper-run aan.
export function persistProvinceCache() {
  if (cacheDirty) {
    saveCache(cache)
    cacheDirty = false
  }
}
