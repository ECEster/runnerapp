// Zoekt het inschrijfgeld in de HTML van een organisatorsite. De bronsites
// (runphy, hardloopkalender, loopjeloopje) noemen geen prijs, dus dit is de
// enige plek waar hij staat — maar elke site schrijft het anders op.
//
// Werkwijze: elk bedrag (€ 5 / € 7,50 / 12,50 euro) telt alleen mee als er in
// de tekst ervóór een woord als "inschrijfgeld", "kosten" of "tarief" staat,
// en niet vlak ervoor een woord dat op iets anders wijst (medaille, team,
// korting, parkeren, ...). Bij meerdere bedragen wordt het een bereik van
// laagste tot hoogste ("5 - 12,50"), in dezelfde vorm als de prijzen die al in
// de database staan.
//
// Dit is bewust een VOORSTEL: het resultaat gaat naar price_suggestion, met
// het zinnetje waar het bedrag uit komt, en wordt pas zichtbaar op de site als
// iemand in het admin-paneel op "Overnemen" klikt (zie suggest-prices.js).

const NAMED = { amp: '&', quot: '"', apos: "'", nbsp: ' ', euro: '€', ndash: '–', mdash: '—', eacute: 'é', euml: 'ë' }

function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (e, c) => {
    if (c[0] === '#') {
      const n = c[1].toLowerCase() === 'x' ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : e
    }
    return NAMED[c.toLowerCase()] ?? e
  })
}

export function htmlToText(html) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

// Woorden die aangeven dat het over het inschrijfgeld gaat (in de ±150 tekens vóór het bedrag)
const KEYWORD = /inschrijfgeld|inschrijf\s?kosten|inschrijvingskosten|inschrijving|startgeld|startbewijs|deelname\s?(?:kosten|prijs|bijdrage)|kosten|tarie(?:f|ven)|prijs\b/gi
// Woorden vlak vóór het bedrag die erop wijzen dat het géén inschrijfgeld is
const NOT_ENTRY_FEE = /korting|toeslag|borg|chip|parkeer|parkeren|consumptie|lidmaatschap|contributie|medaille|shirt|team|competitie|abonnement|seizoen|donatie|sponsor|servicekosten|administratiekosten|transactiekosten|statiegeld|maaltijd|pasta|prijzengeld|geldprijs|winnaar|hoofdprijs|overnachting|camping|annuler|wijzigen|ombouw|douche|bagage|foto|bedrij[fv]|business|zakelijk|btw|\b[1-9](?:ste|de|e)\b/i
// Na het bedrag: "€ 2 korting", "€ 1 extra", "€ 75 per team"
const NOT_ENTRY_FEE_AFTER = /^\W{0,4}(?:korting|toeslag|extra|meer|per team|borg)/i
// € 5 / €5,- / € 7,50 / €12.50,= — of 12,50 euro
const AMOUNT = /€\s?(\d{1,3}(?:[.,]\d{1,2})?)(?![\d]|[.,]\d)|(\d{1,3}(?:[.,]\d{1,2})?)\s?euro\b/gi

const BEFORE = 150
const NEAR = 35

function formatAmount(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',')
}

// Geeft { price, quote } terug, of null als er geen inschrijfgeld te vinden is.
export function extractPriceFromText(text) {
  const values = new Set()
  let quote = null
  let m
  AMOUNT.lastIndex = 0
  while ((m = AMOUNT.exec(text))) {
    const before = text.slice(Math.max(0, m.index - BEFORE), m.index)
    const keywords = [...before.matchAll(KEYWORD)]
    if (!keywords.length) continue
    if (NOT_ENTRY_FEE.test(before.slice(-NEAR))) continue
    if (NOT_ENTRY_FEE_AFTER.test(text.slice(m.index + m[0].length, m.index + m[0].length + 15))) continue
    const v = parseFloat((m[1] || m[2]).replace(',', '.'))
    if (!(v > 0 && v < 300)) continue
    values.add(v)
    if (!quote) {
      // Het zinnetje vanaf het laatste sleutelwoord, ruim genoeg om de bedragen erna te zien
      const start = m.index - before.length + keywords.at(-1).index
      quote = text.slice(start, start + 200).replace(/\s+\S*$/, '').trim()
    }
  }
  if (!values.size) return null
  const sorted = [...values].sort((a, b) => a - b)
  const lo = sorted[0]
  const hi = sorted.at(-1)
  return { price: lo === hi ? formatAmount(lo) : `${formatAmount(lo)} - ${formatAmount(hi)}`, quote }
}

export function extractPrice(html) {
  return extractPriceFromText(htmlToText(html))
}

// Links op dezelfde site die waarschijnlijk naar de prijsinformatie gaan
// (bv. "Inschrijven", "Info & tarieven") — voor als de inschrijflink zelf
// geen bedrag noemt.
export function findPriceLinks(html, baseUrl, max = 4) {
  let host
  try { host = new URL(baseUrl).hostname } catch { return [] }
  const out = new Set()
  for (const m of html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    if (!/inschrij|prijs|tarie|kosten|deelname|info/i.test(`${m[1]} ${m[2]}`)) continue
    try {
      const u = new URL(decode(m[1]), baseUrl)
      if (u.hostname === host && /^https?:$/.test(u.protocol) && u.href !== baseUrl) out.add(u.href)
    } catch {
      // ongeldige link
    }
    if (out.size >= max) break
  }
  return [...out]
}
