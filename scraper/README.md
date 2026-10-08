# Events-scraper

Verzamelt hardloopevenementen in alle 12 provincies van Nederland van
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

## Herinnering "prijs volgt" (e-mail + admin-paneel)

Sommige evenementen worden bewust met `prijs: "volgt"` gepubliceerd (bv.
jaarwisselingsevenementen waarvan de organisator de prijs pas laat
bekendmaakt). Twee signalen zorgen dat je dit niet vergeet:

1. **Admin-paneel**: zodra je inlogt zie je bovenaan een geel blok "Prijs nog
   niet bekend" met elk zo'n evenement dat binnen 4 maanden plaatsvindt, met
   een link naar de organisatorsite. Geen instelling nodig, werkt meteen.
2. **E-mail** (`check-pending-prices.js` +
   `.github/workflows/check-pending-prices.yml`): draait automatisch op
   **15 okt, 1 nov, 15 nov, 1 dec en 15 dec** (elk jaar) en mailt naar
   `runningnederland@gmail.com` — maar alleen als er daadwerkelijk iets te
   melden is. Schrijft nergens naar de database, puur een signalering.

Eenmalig instellen voor de e-mail (naast de twee Supabase-secrets die al voor
de scraper nodig zijn):
1. Kies een Gmail-account om **vanaf** te versturen (mag hetzelfde
   `runningnederland@gmail.com`-account zijn, of een ander account — het hoeft
   niet het ontvangende adres te zijn).
2. Zet 2-staps-verificatie aan op dat account (vereist voor App-wachtwoorden)
   en maak een **App-wachtwoord** aan via
   [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   — dit is een apart 16-tekens-wachtwoord, niet je normale Gmail-wachtwoord.
3. Voeg in de GitHub-repo (**Settings → Secrets and variables → Actions**)
   twee nieuwe **Repository secrets** toe:
   - `GMAIL_SENDER_ADDRESS` — het volledige e-mailadres van het verzendende account
   - `GMAIL_APP_PASSWORD` — het zojuist aangemaakte App-wachtwoord

Handmatig testen (zonder op een geplande datum te wachten): ga naar de
**Actions**-tab → "Controleer evenementen met prijs 'volgt'" → **Run
workflow**. Is er op dat moment niets met prijs "volgt" binnen 4 maanden,
dan wordt er ook geen e-mail verstuurd — dat is geen fout.

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

## Herinnering voor de volgende sessie: kapotte links (linkcheck 2026-09-30)

Bij de linkcheck van 30 september 2026 zijn 7 links al gerepareerd. Deze punten staan nog open:

- **Geen nieuwe evenementpagina gevonden.** De oude link geeft een 404, de homepage van de
  organisator werkt wel. Kies per evenement: homepage invullen, zelf een betere pagina
  zoeken, of wachten tot de organisator een nieuwe pagina online zet (alle drie concept,
  datum in 2027).
  - #139 Stadtmüller-Udikloop (2027-01-16): `udik.nl/index.php/udikloop/` is weg.
  - #307 Poptimaal Run (2027-06-11): `poptimaal.nl/run` is weg; de site heeft nu `/run-1`,
    `/run-2` en `/run-3`, niet duidelijk welke erbij hoort.
  - #285 Ten Poster Meul'n Loop (2027-05-20): `svteo.nl/nieuws.html` is weg.
- **#31 DSW Bruggenloop Rotterdam (gepubliceerd):** de Unsplash-afbeelding bestaat niet meer,
  er is een nieuwe foto nodig.
- **#53 Artemisrun:** het SSL-certificaat van `artemisrun.nl` is verlopen (browserwaarschuwing).
- **#104/#275 Loop Leeuwarden:** de site toont een "Binnenkort terug"-pagina.
- **Niet automatisch te controleren, even zelf in de browser openen:** alle `avhorror.nl`-links
  (10 evenementen, gaf steeds 429), de Facebook-links (Mjitte Run, Wintertrimloop Makkum,
  Fytris Crosstrailloop, Heiderun Noardburgum) en `triatlonleeuwarden.nl` (403).

## Herinnering voor de volgende sessie: prijzen en beveiliging (2026-09-30)

Op 30 september 2026 zijn de prijzen voor oktober–december 2026 gecontroleerd en aangevuld
(49 automatisch gevonden, de rest handmatig via twee Claude-artifacts). Lauwersmeer Najaarstocht
(#36), Dorpsloop Nij Beets (#73) en Oliebollen cross (#220) zijn verwijderd omdat ze in 2026 niet
doorgaan.

RLS op `events` is op 2026-10-01 afgerond: alleen "Admin schrijft", "Allow public read" en
"Lezen" staan nog. Die eerste en laatste kijken in de `admins`-tabel, die zelf ook RLS heeft;
daarom staat daar de policy "Eigen admin-rij lezen" (`user_id = auth.uid()`). Zonder die policy
ziet de controle een lege tabel en weigert Supabase stil elke wijziging vanuit het adminpaneel.

Deze punten staan nog open:

- **#60 Menzis 4 Mijl van Groningen:** prijs moet `10,25 - 24,25` worden
  (ingevuld was `10,25 - 24,24`, de site noemt 24,25). Nu staat er `24,25`.
- **#136 DTSV Decemberloop Peize:** staat offline, nog niet besloten of hij weer gepubliceerd moet.
- **#28 Berenloop Marathon:** prijs in afwijkende notatie (`€36.50–€41`), wordt `36,50 - 41`.
- **Prijzen op "volgt"** (organisator had nog geen 2026-prijs): 1e GPI Winterloop, Sint Thomas
  Trailrun, Santa Run, Kerstcross Vlieland, sv Friesland Oudejaarscross, Sylvesterloop Glimmen,
  Silvesterloop Poppenwier, Sinterklaasloop Bolsward, Oliebollenloop (inschrijving opent 1 okt).
  De geplande herinnering (`check-pending-prices.js`) pikt deze vanzelf op.
- **Prijzen 2027** zijn nog niet gecontroleerd (±220 evenementen zonder prijs).
- Het commentaar in `check-pending-prices.js` zegt dat `price` niet in de anon-selectie zit,
  maar anon kan `price` wel lezen. Commentaar bijwerken of kolomrechten aanpassen.

## Herinnering voor de volgende sessie: Oost-evenementen publiceren (2026-10-01)

De regiopagina Oost (`regio-oost.html`) toont bijna niets: op 1 oktober 2026 stond er maar
1 gepubliceerd evenement in Gelderland en 0 in Overijssel en Flevoland (Noord: 80). De code
is in orde (Oost gebruikt dezelfde `regio.js` als Noord); het ligt aan de data. De scraper
schrijft nieuwe events met `published: false`, en de website toont alleen gepubliceerde events.
Met de anon-sleutel zijn concepten niet te zien, dus het is nog onbekend of de Oost-evenementen
al als concept in de database staan.

1. **Kijken wat er als concept staat.** In Supabase → SQL Editor → New query → Run (verandert niets):
   ```sql
   select id, name_nl, date, city, province, price, registration_url
   from public.events
   where published = false
     and province in ('Overijssel', 'Gelderland', 'Flevoland')
     and date >= current_date
   order by date;
   ```
2. **Lege lijst?** Dan is de scraper voor Oost nog niet live gedraaid. Eerst `node run-dry-run.js`,
   daarna `node write-events.js --live` (dit vereist een `.env` met de Supabase-sleutels; die staat niet op de laptop).
   Minder rijen dan verwacht? Controleer de provincienamen:
   `select province, count(*) from public.events group by province order by 2 desc;`
3. **Lijst nalopen** op foute links, dubbelen, prijzen en evenementen die in 2026 niet doorgaan
   (bij Noord bleek dat nodig).
4. **Publiceren** (eventueel met `and id not in (…)` voor evenementen die je wilt overslaan):
   ```sql
   update public.events
   set published = true
   where published = false
     and province in ('Overijssel', 'Gelderland', 'Flevoland')
     and date >= current_date;
   ```
   Ververs daarna `regio-oost.html` en controleer de kalender en de cards.
5. Daarna geldt hetzelfde voor **West** en **Zuid** (op 1 oktober 2026: 2 gepubliceerd in West, 0 in Zuid).

## Herinnering voor de volgende sessie: types en foto's (2026-10-01)

Op 1 oktober 2026 gedaan: de typebadge staat in alle eventkaarten rechtsonder in de foto
(transparant, lichtgrijze letters); trails, swimruns en bikeruns hebben een eigen fallback-foto
(`images/trail.jpg`, `swimrun.jpg`, `bikerun.jpg`, verkleind naar ±250 KB); de scraper geeft
events met "trail" in de naam voortaan type `trail`; RUN-BIKE-FUN Sneek (#180) is `bikerun`.

Deze punten staan nog open:

- **Trimlopen Assen (#183, #194, #206) → wegevenement met de crossfoto.** Nog niet uitgevoerd
  (kidsrun stond al aan). In de Supabase SQL Editor:
  ```sql
  update public.events
  set image = 'images/cross.jpg', type = 'wegevenement', kidsrun = true
  where id in (183, 194, 206)
  returning id, name_nl, type, kidsrun, image;
  ```
- **Bestaande trails → type trail.** Gaasterland Trail, Devil's Night Trail, Devil's Trail,
  Sytze Wettingtrail en Schutrups Sperwerstrail staan nog op `wegevenement` (de trailfoto
  krijgen ze al via hun naam):
  ```sql
  update public.events set type = 'trail'
  where name_nl ilike '%trail%'
  returning id, name_nl, type;
  ```
- **Grote foto's verkleinen** (maken de site traag op mobiel): `urbanrun.jpg` (3,5 MB),
  `hero.png` (2,8 MB), `ultrarun.jpg` (2,7 MB), `gemengd-parcours.png` (2,1 MB). Naar ±1200 px
  breed, JPG-kwaliteit ±82, zoals bij trail/swimrun/bikerun.
- **`.env` in `scraper/`** met `SUPABASE_SERVICE_ROLE_KEY` (zie `.env.example`): zonder die
  sleutel kan Claude geen database-wijzigingen doen en moet alles via de SQL Editor.

## Coördinaten (postcodefilter)

Events hebben `lat`/`lng` (migratie `0006_add_lat_lng.sql`) voor het postcode/straal-filter.
`geocode-events.js` vult ze in op basis van plaats + provincie via de PDOK Locatieserver
(gratis, geen sleutel). De GitHub Action draait het na elke live scrape; handmatig:
`node geocode-events.js` (dry-run) of `node geocode-events.js --live`. Events die via het
adminpaneel worden toegevoegd krijgen pas coördinaten als dit script weer draait.
