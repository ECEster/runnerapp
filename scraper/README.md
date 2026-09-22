# Events-scraper

Verzamelt hardloopevenementen in Noord-Nederland (Groningen, Friesland, Drenthe) van
runphy.nl, hardloopkalendernederland.nl en loopjeloopje.nl, en schrijft nieuwe events
naar de Supabase `events`-tabel (altijd met `published: false` — jij publiceert
handmatig in het admin-portaal).

Zie **[BRONNEN.md](./BRONNEN.md)** voor een overzicht per regio (Noord/Oost/Zuid/West):
welke regio's al gescraped worden, welke bronnen daarbij gebruikt worden, en wat die
bronnen wél/niet vertellen (bv. waarom een kidsrun soms gemist wordt).

## Installatie

```
cp .env.example .env
```

Vul in `.env` in:
- `SUPABASE_URL` — Project Settings → API in het Supabase-dashboard
- `SUPABASE_SERVICE_ROLE_KEY` — idem, de **service_role** key (niet de anon key)

`.env` staat in `.gitignore` en mag nooit gecommit worden. De service_role key negeert
Row Level Security volledig — gebruik dit script dus alleen lokaal of in een vertrouwde
geplande taak, nooit vanuit frontend-code.

## Gebruik

```
node write-events.js              # dry-run (standaard) — print alleen wat er zou gebeuren
node write-events.js --live       # schrijft daadwerkelijk naar Supabase
```

Losse test-/inspectiescripts:
- `node test-step3.js` — toont de eerste 5 geparste runphy.nl-events (Groningen)
- `node test-step4.js` — toont alle geparste hardloopkalendernederland.nl-events (Groningen)
- `node test-step5.js` — toont de eerste 5 Noord-Nederlandse loopjeloopje.nl-events
  (na filtering via PDOK)
- `node run-dry-run.js` — volledige dry-run zonder de Supabase-verbinding (dus zonder
  dedup tegen bestaande database-rijen, en zonder dat `.env` nodig is). Duurt bij een
  **eerste** run (lege cache) een paar minuten door de PDOK-opzoekingen voor
  loopjeloopje.nl (zie hieronder) — daarna, met een gevulde `.cache/`, seconden.

## Veiligheidsmaatregelen in write-events.js

- **Dry-run is de standaard.** Alleen `--live` schrijft echt.
- **Limiet van 50 nieuwe events per run.** Zou een run er meer willen wegschrijven, dan
  stopt het script zonder iets te schrijven — dat is een signaal dat een bron een andere
  structuur teruggeeft dan verwacht. **Let op:** sinds loopjeloopje.nl erbij is (die veel
  evenementen heeft die de andere twee bronnen niet kennen) levert een eerste `--live`-run
  waarschijnlijk ruim meer dan 50 nieuwe events op — verhoog `MAX_INSERTS_PER_RUN` tijdelijk
  (zoals eerder ook al eens gedaan, zie git-historie), en zet 'm terug naar 50 zodra de
  eenmalige inhaalslag achter de rug is.
- **Dedupliceert tweemaal:** eerst onderling (tussen de drie bronnen, zie `lib/dedupe.js`),
  daarna tegen wat al in de database staat (`lib/dedupeAgainstDb.js`). Beide gebruiken
  dezelfde matchlogica:
  1. Datum + plaats (of datum + naam als plaats onbekend is) — exacte match, zo herken je
     hetzelfde evenement ook als de naam op de bronnen anders geschreven staat (bv.
     "Woellust Run" vs. "Woellustrun").
  2. Als dat niet matcht: dezelfde datum + een sterk overeenkomende naam (zie
     `lib/nameSimilarity.js`). Vangt het geval waarin de ene bron geen plaats geeft en de
     andere een andere/specifiekere plaats geeft voor dezelfde run (bv. "4 mijl 4 You Haren
     - Groningen", plaats onbekend, vs. "4 Mijl van Groningen", plaats "Haren" — Haren is in
     2019 bij de gemeente Groningen gevoegd). Bewust terughoudend: vereist minstens één
     gedeeld woord dat geen generieke loopterm ("km", "loop", "5", ...) is, en behandelt
     "Kleintje X" / "Kids X" / "Mini X" altijd als een ANDER evenement dan "X" (vaak een
     losstaande kortere/jeugdvariant op dezelfde kalender).
- **published: false voor elke nieuwe rij** — niets komt automatisch live.

## Tests

```
node --test lib/*.test.js
```

Test de dedupliceer-logica (`lib/dedupe.js`, `lib/dedupeAgainstDb.js`,
`lib/nameSimilarity.js`) met o.a. het echte "4 Mijl van Groningen"-scenario dat
eerder drie keer los in de database terechtkwam, de kidsrun-herkenning
(`lib/detectKidsrun.js`), en het uitlezen van de loopjeloopje.nl-tabel
(`lib/parseLoopjeLoopje.js`). Geen netwerk of `.env` nodig — de provincie-
opzoeking via PDOK (`lib/resolveProvince.js`) wordt bewust niet unit-getest
(netwerkafhankelijk, net als `lib/fetchPage.js`), maar handmatig gecontroleerd
met `node run-dry-run.js`.

## Bekende beperkingen (bewuste keuzes, geen bugs)

- De fuzzy naam-check in `lib/dedupeAgainstDb.js` vergelijkt alleen tegen `name_nl` van
  bestaande rijen. Een handmatig/officieel toegevoegd evenement met een sponsornaam die
  niets met de geschraapte naam deelt (bv. "Menzis 4 Mijl & Kids 4 Mijl" vs. "4 Mijl van
  Groningen" — geen gedeeld, niet-generiek woord in de titel zelf) wordt dus niet
  automatisch herkend als dezelfde run. Geeft in het ergste geval een extra concept-rij
  naast een al gepubliceerd evenement — geen dataverlies, je ziet en verwijdert 'm gewoon
  tijdens het reviewen.
- `afstanden`/`plaats`-herkenning bij hardloopkalendernederland.nl is patroonherkenning op
  vrije tekst; zie de uitgebreide toelichting bovenaan `lib/parseHardloopkalender.js`.
  Sommige events krijgen terecht `plaats: null` omdat de bron geen "in [plaats]" vermeldt.
- `kidsrun` wordt automatisch op `true` gezet als de naam of een van de afstanden/onderdelen
  een kids-achtig woord bevat (zie `lib/detectKidsrun.js`) — maar alleen als de bron dat zelf
  al vermeldt. Noemt runphy.nl/hardloopkalendernederland.nl geen kidsrun terwijl de
  organisator die op zijn eigen site wél aanbiedt (bv. Kûbaarder Hurdrindei), dan blijft dit
  `false` staan. Zie [BRONNEN.md](./BRONNEN.md) voor meer over wat de bronnen wél/niet
  vertellen. Controleer dit dus ook tijdens het reviewen.
- `type` (bv. "wegevenement" vs. "trail") en `organizer` (organisatienaam) worden niet
  betrouwbaar uit de bronnen afgeleid — zie `lib/mapToSupabaseShape.js`. Corrigeer dit
  tijdens het reviewen in het admin-portaal.
- `afbeelding_url` wordt nog altijd leeg gelaten (gereserveerd voor een latere
  Unsplash-koppeling).
- De provincie-opzoeking voor loopjeloopje.nl (`lib/resolveProvince.js`, via de PDOK
  Locatieserver) is officieel en betrouwbaar, maar niet feilloos: een handjevol
  verouderde/Friese spellingen die PDOK niet als woonplaats kent (bv. "Bergum" i.p.v. het
  officiële "Burgum") staat in een kleine alias-lijst bovenin dat bestand — kom je een
  gemist evenement tegen door een plaatsnaam die PDOK niet herkent, voeg 'm daar toe.
  Bij een niet-eenduidige plaatsnaam (bv. twee dorpen die "Winsum" heten, één in
  Groningen én één in Friesland) wordt de eerste/best-scorende treffer gebruikt — voor
  onze filtering (hoort dit bij Noord-Nederland, ja/nee) maakt dat toevallig niet uit
  omdat beide sowieso Noord zijn, maar bij uitbreiding naar andere regio's kan dat wel
  een keer misgaan.

## Draaien vanaf GitHub (zonder deze computer)

Er is een GitHub Actions workflow (`.github/workflows/scrape-events.yml`) die dit script
op GitHub's eigen servers draait — je hebt hiervoor geen lokale computer nodig. Hij start
**alleen handmatig**, niet op een schema.

Eenmalig instellen:
1. Ga naar de GitHub-repo → **Settings → Secrets and variables → Actions**.
2. Voeg twee **Repository secrets** toe: `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY`
   (dezelfde waarden als in je lokale `.env`). Secrets zijn versleuteld en komen nooit in
   logs of code terecht.

Draaien:
1. Ga naar de **Actions**-tab van de repo (op GitHub.com, ook vanaf je telefoon).
2. Kies "Scrape hardloopevenementen" → **Run workflow**.
3. Vink "live" aan om écht te schrijven, laat 'm uit voor een dry-run (print alleen, net
   als lokaal). Bekijk de output onder de workflow-run.

Voor de PDOK-opzoeking (loopjeloopje.nl → provincie) is geen extra secret nodig — die
service is publiek toegankelijk zonder sleutel. Wel start elke Actions-run met een lege
`.cache/` (geen vorige run om op verder te bouwen), dus duurt een run op GitHub altijd
een paar minuten door de ~350 opzoekingen, ook al is dat lokaal met een gevulde cache
al eens sneller gegaan.

## Nog te bouwen

- Migratie `migrations/0001_add_source_url.sql` moet je nog handmatig uitvoeren in de
  Supabase SQL Editor (voegt de `source_url`-kolom toe) voordat `write-events.js` succesvol
  kan schrijven.
- Afbeeldingen ophalen (Unsplash API).
