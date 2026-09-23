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

// Haalt van bestaande events alle velden op die de scraper ooit invult (zie
// mapToSupabaseShape.js) — nodig om te bepalen (a) of een event al bestaat
// (via serie+date, zie lib/dedupeAgainstDb.js) en (b) welke velden op een
// bestaande rij nog leeg zijn en dus aangevuld mogen worden.
const EXISTING_EVENT_FIELDS =
  'id,name_nl,date,city,province,distances,registration_url,source_url,image,type,organizer,kidsrun,serie,editie'

export async function fetchExistingEventKeys() {
  const res = await fetch(`${baseUrl()}/rest/v1/events?select=${EXISTING_EVENT_FIELDS}`, {
    headers: headers(),
  })
  if (!res.ok) {
    throw new Error(`Kon bestaande events niet ophalen: HTTP ${res.status} — ${await res.text()}`)
  }
  return res.json()
}

// Werkt één of meer velden van een bestaand event bij (voor het aanvullen van
// lege velden vanuit de scraper — zie lib/dedupeAgainstDb.js — of vanuit
// backfill-serie.js). Overschrijft alleen wat je in 'fields' meegeeft.
export async function updateEventFields(id, fields) {
  const res = await fetch(`${baseUrl()}/rest/v1/events?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify(fields),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} — ${await res.text()}`)
  }
  const data = await res.json()
  return data[0]
}

// Haalt alleen de velden op die backfill-serie.js nodig heeft: genoeg om een
// serie te berekenen (name_nl, city) en te bepalen of dat al gebeurd is
// (serie), plus id + date om te updaten en op te groeperen.
export async function fetchAllEventsForBackfill() {
  const res = await fetch(`${baseUrl()}/rest/v1/events?select=id,name_nl,city,date,serie`, {
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
