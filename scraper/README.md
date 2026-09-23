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
- **Dedupliceert tweemaal, met verschillende matchlogica per stap:**
  1. **Onderling** (tussen de drie bronnen, `lib/dedupe.js`) op datum + plaats (of datum +
     naam als plaats onbekend is), met een tweede, voorzichtigere ronde op datum + een sterk
     overeenkomende naam (zie `lib/nameSimilarity.js`) voor het geval de ene bron geen plaats
     geeft en de andere een andere/specifiekere plaats geeft voor dezelfde run (bv. "4 mijl 4
     You Haren - Groningen", plaats onbekend, vs. "4 Mijl van Groningen", plaats "Haren").
     Bewust terughoudend: vereist minstens één gedeeld woord dat geen generieke loopterm
     ("km", "loop", "5", ...) is, en behandelt "Kleintje X" / "Kids X" / "Mini X" altijd als
     een ANDER evenement dan "X".
  2. **Tegen de database** (`lib/dedupeAgainstDb.js`) op de combinatie `(serie, date)` — zie
     "Serie & editie" hieronder. Bestaat die combinatie al, dan wordt er geen nieuwe rij
     aangemaakt maar worden alleen de velden aangevuld die op de bestaande rij nog leeg zijn;
     een niet-lege bestaande waarde wordt nooit overschreven (je corrigeert soms handmatig
     via het admin-paneel).
- **published: false voor elke nieuwe rij** — niets komt automatisch live.

## Serie & editie

Elke jaargang van een terugkerend evenement blijft een eigen rij, gekoppeld via een
stabiele `serie`-kolom (bv. `4-mijl-van-groningen`), plus een optionele `editie`-kolom
(het editienummer van díe specifieke rij).

- `lib/buildSerie.js` berekent `serie` uit naam + plaats: kleine letters, leestekens weg,
  jaartallen/rangtelwoorden weg, veelvoorkomende Nederlandse stopwoorden (net als
  `lib/nameSimilarity.js`, incl. "van") genegeerd. Zo leveren "De 4 Mijl van Groningen 2026"
  en "4 Mijl Groningen" beide `4-mijl-groningen` op.
- `lib/extractEditie.js` haalt een editienummer alleen uit een EXPLICIET signaal in de ruwe
  brontekst — een leidend rangtelwoord (bv. "22ste Proostmeerloop") of "sinds JJJJ" (dan
  berekend uit het evenementjaar). Geen van beide gevonden → `null`, er wordt nooit gegokt.
- Beide zijn los, met eigen tests (`lib/buildSerie.test.js`, `lib/extractEditie.test.js`) —
  pas de logica daar aan als je een geval tegenkomt dat verkeerd wordt herkend.
- **Eenmalige backfill:** bestaande rijen (van vóór deze migratie) hebben nog geen `serie`.
  Draai `node backfill-serie.js` (dry-run eerst!) om die te vullen — zie de bestandskop van
  dat script en "Nog te bouwen" hieronder voor de vereiste volgorde t.o.v. de migraties.
- Beide velden zijn ook zichtbaar en met de hand corrigeerbaar in het admin-paneel.

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

- `lib/dedupeAgainstDb.js` herkent een bestaande rij alleen via diens (al ingevulde) `serie`-
  kolom. Rijen die nog geen `serie` hebben (vóór `node backfill-serie.js` is gedraaid) worden
  dus niet herkend en kunnen een extra concept-rij opleveren naast het origineel — geen
  dataverlies, je ziet en verwijdert 'm gewoon tijdens het reviewen.
- `buildSerie()` gebruikt naam + plaats; twee jaargangen van hetzelfde, generiek genoemde
  evenement (bv. kaal "Bosloop") kunnen een net andere serie krijgen als de drie bronnen het
  onderling oneens zijn over de plaats — zie de toelichting bovenin `lib/buildSerie.js`.
- `extractEditie()` vindt in de huidige 3 bronnen vrijwel alleen het "leidend rangtelwoord"-
  signaal (bv. "22ste Proostmeerloop" bij hardloopkalendernederland.nl); "sinds JJJJ" komt er
  niet in voor omdat geen van de bronnen vrije beschrijvingstekst aanlevert. `editie` blijft
  voor de meeste events dus `null` tot je 'm handmatig invult in het admin-paneel.
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

## Nog te bouwen / nog uit te voeren

- **Serie/editie in productie zetten** (nieuw, nog niet gedaan): voer in deze volgorde uit in
  de Supabase SQL Editor en op de command line —
  1. `migrations/0002_add_serie_editie.sql` (voegt `serie` en de check-constraint op `editie`
     toe — `editie` zelf bestaat al in de tabel).
  2. `node backfill-serie.js` (dry-run, controleer de gemelde mogelijke dubbelen, corrigeer
     die zo nodig in het admin-paneel, dan pas `--live`).
  3. Pas dán `migrations/0003_unique_serie_date.sql` (de unique constraint faalt als er op
     dat moment nog dubbele (serie, date)-combinaties bestaan).
- Afbeeldingen ophalen (Unsplash API).
