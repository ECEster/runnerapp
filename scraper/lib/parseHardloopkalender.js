// Parser voor hardloopkalendernederland.nl provinciepagina's — platte tekst, geen JSON-LD.
//
// Structuur per regel (binnen een <div class="h5"> per maand):
//   Zaterdag 5 september: <a href="URL">22ste Proostmeerloop in Wagenborgen 15h30' 5km - 10km</a>
//
// AANNAMES (belangrijk om te weten voordat je dit vertrouwt):
//
// 1. Datum: de dag+maand staat altijd voor de dubbele punt, bv. "Zaterdag 5 september".
//    Sommige evenementen lopen over 2 dagen: "Zaterdag 19 september en Zondag 20 september:
//    ...". We nemen dan alleen de EERSTE datum als 'datum' (startdatum).
// 2. Jaartal: staat niet per regel, maar één keer op de pagina (bv. "Groningen 2026" in de
//    <div class="h1">). We geven dat apart als parameter mee.
// 3. Afstanden + tijd worden "van rechts afgepeld": we lopen de tekst woord voor woord van
//    achteren naar voren en blijven net zo lang doorgaan als een woord een tijd-patroon
//    (bv. "15h30'", "9h") of een afstand-patroon (bv. "5km", "42,195km", "10x10km") is, of
//    simpelweg een "-" koppelteken. Zodra een woord geen van die vormen heeft, stoppen we —
//    alles daarvoor is de "naam (in plaats)"-tekst, alles daarna zijn de afstanden.
//    Dit werkt correct bij bv. "4 mijl 4 You Haren - Groningen 20h15' 6,438km" (waar "mijl"
//    ook los in de naam voorkomt), omdat we van rechts komen en "Groningen" niet op een
//    tijd/afstand-patroon lijkt, dus daar stoppen we — "4 mijl 4 You Haren - Groningen"
//    blijft als naam/plaats-tekst intact.
//    BEKENDE ZWAKTE: als een evenement geen tijd/afstand aan het eind heeft (komt hier niet
//    voor, maar theoretisch mogelijk), kan de hele tekst als naam worden gezien.
// 4. Naam vs. plaats: als de resterende tekst " in " bevat, splitsen we op de LAATSTE " in "
//    (naam vóór, plaats erna). Niet elke regel heeft dat woord (bv. "32ste De 4 mijl van
//    Groningen" of "4 mijl 4 You Haren - Groningen") — dan blijft 'plaats' null en staat de
//    volledige tekst in 'naam'. Dit is een bewuste keuze: liever plaats=null dan een
//    verkeerd geraden plaatsnaam.
// 5. We strippen een leidend editie-nummer zoals "22ste " of "12de " uit de naam, zodat de
//    naam aansluit bij hoe runphy.nl namen zonder zo'n prefix toont (bv. "Woellust Run" i.p.v.
//    "12de Woellust Run").
// 6. organisator_url = de href van de <a>-tag. Er is geen apart 'bron_url' naar een detail-
//    pagina op hardloopkalendernederland.nl zelf (die bestaat niet) — bron_url wordt daarom
//    de provinciepagina-URL die je meegeeft.
// 7. afbeelding_url: deze bron heeft nooit een afbeelding — altijd null (net als bij runphy,
//    bewust leeg gelaten voor een latere stap).

const MONTHS_NL = {
  januari: 1,
  februari: 2,
  maart: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  augustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  december: 12,
}

const EVENT_LINE_RE =
  /([A-Za-zé]+dag \d{1,2} [a-zé]+)(?: en [A-Za-zé]+dag \d{1,2} [a-zé]+)?:\s*<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g

const TIME_TOKEN_RE = /^\d{1,2}h\d{0,2}'?$/i
const DISTANCE_TOKEN_RE = /^\d+(?:x\d+(?:,\d+)?)?(?:,\d+)?(?:km|mijl|mi)$/i
const LEADING_ORDINAL_RE = /^\d+(?:ste|de)\s+/i

function parseDateLine(dateText, year) {
  const m = dateText.match(/(\d{1,2})\s+([a-zé]+)$/i)
  if (!m) return null
  const day = Number(m[1])
  const month = MONTHS_NL[m[2].toLowerCase()]
  if (!month) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Peelt tijd/afstand-woorden van rechts af. Geeft { descriptor, afstanden } terug.
function splitDescriptorAndDistances(text) {
  const words = text.trim().split(/\s+/)
  const distances = []
  let cut = words.length

  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i]
    if (DISTANCE_TOKEN_RE.test(word)) {
      distances.unshift(word)
      cut = i
      continue
    }
    if (TIME_TOKEN_RE.test(word) || word === '-') {
      cut = i
      continue
    }
    break
  }

  return {
    descriptor: words.slice(0, cut).join(' ').trim(),
    afstanden: [...new Set(distances)],
  }
}

function splitNaamEnPlaats(descriptor) {
  const withoutOrdinal = descriptor.replace(LEADING_ORDINAL_RE, '')
  const idx = withoutOrdinal.lastIndexOf(' in ')
  if (idx === -1) {
    return { naam: withoutOrdinal.trim(), plaats: null }
  }
  return {
    naam: withoutOrdinal.slice(0, idx).trim(),
    plaats: withoutOrdinal.slice(idx + 4).trim(),
  }
}

export function parseHardloopkalenderEvents(html, { year, provincie, bronUrl }) {
  const events = []
  let match

  while ((match = EVENT_LINE_RE.exec(html))) {
    const [, dateText, href, linkText] = match

    const datum = parseDateLine(dateText, year)
    const { descriptor, afstanden } = splitDescriptorAndDistances(linkText)
    const { naam, plaats } = splitNaamEnPlaats(descriptor)

    events.push({
      naam: naam || null,
      datum,
      plaats,
      provincie,
      afstanden,
      organisator_url: href,
      bron_url: bronUrl,
      afbeelding_url: null,
    })
  }

  return events
}
