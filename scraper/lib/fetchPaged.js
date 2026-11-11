// Supabase (PostgREST) geeft per opvraging maximaal 1000 rijen terug. Sinds er
// meer dan 1000 evenementen zijn, zou een gewone fetch stilletjes de rest
// missen (en zou write-events.js bestaande evenementen niet meer herkennen).
//
// fetchPaged(url, init) haalt alle rijen op in porties van 1000 (Range-header)
// en geeft een Response-achtig object terug, zodat bestaande code met
// `res.ok` en `await res.json()` ongewijzigd blijft werken. Alleen voor GET.

const PAGE = 1000

export async function fetchPaged(url, init = {}) {
  const rows = []
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(url, {
      ...init,
      headers: { ...(init.headers || {}), Range: `${from}-${from + PAGE - 1}`, 'Range-Unit': 'items' },
    })
    if (!res.ok && res.status !== 416) return res // fout: laat de aanroeper die melden
    const page = res.status === 416 ? [] : await res.json()
    rows.push(...page)
    if (page.length < PAGE) break
  }
  return { ok: true, status: 200, json: async () => rows, text: async () => JSON.stringify(rows) }
}
