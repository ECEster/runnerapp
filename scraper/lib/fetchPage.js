// Haalt de ruwe HTML van een pagina op. Zet een User-Agent mee, want sommige
// bronnen weigeren verzoeken zonder browser-achtige header.
export async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; RunningNederlandEventsBot/0.1; +https://runningnederland.nl)',
    },
  })

  if (!res.ok) {
    throw new Error(`Kon ${url} niet ophalen: HTTP ${res.status}`)
  }

  return res.text()
}
