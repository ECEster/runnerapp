// Parser voor runphy.nl provinciepagina's.
//
// Elke evenement-kaart op de pagina heeft een eigen <script type="application/ld+json">
// blok met een @graph van [SportsEvent, BreadcrumbList]. We lezen dat rechtstreeks uit
// de HTML — geen aannames nodig, dit is bevestigd door de echte pagina te bekijken.

const LD_JSON_SCRIPT_RE = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g

function extractJsonLdGraphs(html) {
  const graphs = []
  let match
  while ((match = LD_JSON_SCRIPT_RE.exec(html))) {
    try {
      const parsed = JSON.parse(match[1])
      if (Array.isArray(parsed['@graph'])) {
        graphs.push(parsed['@graph'])
      }
    } catch {
      // Blok was geen (geldige) JSON — negeren. Komt voor bij het losse
      // WebSite-blok elders op de pagina, dat heeft geen @graph en wordt
      // dus al uitgesloten door de check hierboven.
    }
  }
  return graphs
}

function dedupeStrings(values) {
  return [...new Set(values)]
}

// Zet één runphy @graph-blok om naar ons doelformat. Geeft null terug als er
// geen SportsEvent in het blok zit (zou niet moeten gebeuren, maar dan slaan
// we het over in plaats van te crashen).
function graphToEvent(graph) {
  const sportsEvent = graph.find((node) => node['@type'] === 'SportsEvent')
  if (!sportsEvent) return null

  const breadcrumb = graph.find((node) => node['@type'] === 'BreadcrumbList')
  const bronUrl = breadcrumb?.itemListElement?.at(-1)?.item ?? null

  const address = sportsEvent.location?.address ?? {}

  return {
    naam: sportsEvent.name ?? null,
    datum: sportsEvent.startDate ?? null,
    plaats: address.addressLocality ?? null,
    provincie: address.addressRegion ?? null,
    afstanden: dedupeStrings((sportsEvent.offers ?? []).map((offer) => offer.name).filter(Boolean)),
    organisator_url: sportsEvent.url ?? null,
    bron_url: bronUrl,
    // Bewust leeg: afbeeldingen worden pas in een latere stap toegevoegd (Unsplash-koppeling).
    // runphy.nl geeft soms zelf al een 'image' mee, maar die nemen we nu nog niet over.
    afbeelding_url: null,
  }
}

export function parseRunphyEvents(html) {
  return extractJsonLdGraphs(html)
    .map(graphToEvent)
    .filter((event) => event !== null)
}
