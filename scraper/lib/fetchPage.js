// Haalt de ruwe HTML van een pagina op. Zet een browser-achtige User-Agent mee — sommige
// bronnen weigeren verzoeken die zich als bot identificeren, zeker vanaf cloud-IP's
// (zoals GitHub Actions-runners).
//
// 'form' (optioneel): velden om als formulier te POSTen in plaats van een
// gewone GET — inschrijven.nl filtert zijn lijst zo op sport (zie
// lib/parseInschrijven.js).
export async function fetchHtml(url, { form } = {}) {
  let res
  try {
    res = await fetch(url, {
      method: form ? 'POST' : 'GET',
      body: form ? new URLSearchParams(form) : undefined,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    // Netwerkfout (DNS, timeout, blokkade, ...) — Node's fetch geeft hier alleen
    // "fetch failed" terug, de échte reden staat in err.cause.
    const cause = err.cause ? ` (${err.cause.code ?? err.cause.message ?? err.cause})` : ''
    throw new Error(`Kon ${url} niet bereiken: ${err.message}${cause}`)
  }

  if (!res.ok) {
    throw new Error(`Kon ${url} niet ophalen: HTTP ${res.status}`)
  }

  return res.text()
}
