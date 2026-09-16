// Server-side Supabase-toegang met de service_role key. NOOIT importeren vanuit
// frontend-/browsercode — deze sleutel negeert Row Level Security volledig.
//
// De sleutel komt uitsluitend uit environment variables (.env, nooit hardcoded/gecommit).

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} ontbreekt. Kopieer .env.example naar .env en vul 'm in voordat je dit script draait.`,
    )
  }
  return value
}

function headers() {
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

function baseUrl() {
  return requireEnv('SUPABASE_URL').replace(/\/$/, '')
}

// Haalt van bestaande events alleen de velden op die nodig zijn voor de dedupliceer-check
// tegen de database (naam/datum/plaats — hier name_nl/date/city, de echte kolomnamen).
export async function fetchExistingEventKeys() {
  const res = await fetch(`${baseUrl()}/rest/v1/events?select=name_nl,date,city`, {
    headers: headers(),
  })
  if (!res.ok) {
    throw new Error(`Kon bestaande events niet ophalen: HTTP ${res.status} — ${await res.text()}`)
  }
  return res.json()
}

// Voegt één event-rij toe. Verwacht de rij al in de vorm van de 'events'-tabel
// (zie lib/mapToSupabaseShape.js).
export async function insertEventRow(row) {
  const res = await fetch(`${baseUrl()}/rest/v1/events`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify(row),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} — ${await res.text()}`)
  }
  const data = await res.json()
  return data[0]
}
