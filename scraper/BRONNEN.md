# Bronnen per regio

Welke website(s) de scraper gebruikt om evenementen te verzamelen, per regio
zoals de site die zelf indeelt (Noord/Oost/Zuid/West — zie `admin-panel.html`
en de `regio-*.html`-pagina's).

## Overzicht

| Regio | Provincies | Actief? | Bronnen |
|---|---|---|---|
| **Noord** | Groningen, Friesland, Drenthe | ✅ Ja | runphy.nl + hardloopkalendernederland.nl + loopjeloopje.nl + inschrijven.nl + hardlopen.nl |
| **Oost** | Overijssel, Gelderland, Flevoland | ✅ Ja | runphy.nl + hardloopkalendernederland.nl + loopjeloopje.nl + inschrijven.nl + hardlopen.nl |
| **Zuid** | Noord-Brabant, Limburg | ✅ Ja | runphy.nl + hardloopkalendernederland.nl + loopjeloopje.nl + inschrijven.nl + hardlopen.nl |
| **West** | Noord-Holland, Zuid-Holland, Utrecht, Zeeland | ✅ Ja | runphy.nl + hardloopkalendernederland.nl + loopjeloopje.nl + inschrijven.nl + hardlopen.nl |

**Sinds 2026-09-30 worden alle 12 provincies gescraped** — zie `PROVINCES` in
`lib/collectEvents.js`. Let op: hardloopkalendernederland.nl schrijft de
URL-slug zonder koppelteken (`noordbrabant`, `noordholland`, `zuidholland`),
runphy.nl met (`noord-brabant`).

## Per bron, per provincie

Beide bronnen gebruiken een provinciepagina met een vaste URL-opbouw. Hieronder
staat voor elke provincie of die URL-vorm klopt (getest 2026-09-22) — handig
als je `PROVINCES` uitbreidt naar Oost/Zuid/West.

| Provincie | Regio | runphy.nl | hardloopkalendernederland.nl |
|---|---|---|---|
| Groningen | Noord | `runphy.nl/events/provinces/groningen` ✅ | `hardloopkalendernederland.nl/groningen/` ✅ |
| Friesland | Noord | `runphy.nl/events/provinces/friesland` ✅ | `hardloopkalendernederland.nl/friesland/` ✅ |
| Drenthe | Noord | `runphy.nl/events/provinces/drenthe` ✅ | `hardloopkalendernederland.nl/drenthe/` ✅ |
| Overijssel | Oost | `runphy.nl/events/provinces/overijssel` ✅ | `hardloopkalendernederland.nl/overijssel/` ✅ |
| Gelderland | Oost | `runphy.nl/events/provinces/gelderland` ✅ | `hardloopkalendernederland.nl/gelderland/` ✅ |
| Flevoland | Oost | `runphy.nl/events/provinces/flevoland` ✅ | `hardloopkalendernederland.nl/flevoland/` ✅ |
| Noord-Brabant | Zuid | `runphy.nl/events/provinces/noord-brabant` ✅ | `hardloopkalendernederland.nl/noordbrabant/` ⚠️ **geen koppelteken**, `.../noord-brabant/` geeft 404 |
| Limburg | Zuid | `runphy.nl/events/provinces/limburg` ✅ | `hardloopkalendernederland.nl/limburg/` ✅ |
| Noord-Holland | West | `runphy.nl/events/provinces/noord-holland` ✅ | `hardloopkalendernederland.nl/noordholland/` ⚠️ **geen koppelteken**, `.../noord-holland/` geeft 404 |
| Zuid-Holland | West | `runphy.nl/events/provinces/zuid-holland` ✅ | `hardloopkalendernederland.nl/zuidholland/` ⚠️ **geen koppelteken**, `.../zuid-holland/` geeft 404 |
| Utrecht | West | `runphy.nl/events/provinces/utrecht` ✅ | `hardloopkalendernederland.nl/utrecht/` ✅ |
| Zeeland | West | `runphy.nl/events/provinces/zeeland` ✅ | `hardloopkalendernederland.nl/zeeland/` ✅ |

Kortom: runphy.nl gebruikt overal hetzelfde patroon (provincienaam met
koppelteken, kleine letters). hardloopkalendernederland.nl doet dat ook,
**behalve** bij Noord-Brabant, Noord-Holland en Zuid-Holland — daar moet het
koppelteken weg (`noordbrabant`, `noordholland`, `zuidholland`).

## loopjeloopje.nl: één landelijke pagina, geen provincie-URL

Deze derde bron werkt anders dan de andere twee: **loopjeloopje.nl heeft geen
aparte pagina per provincie** — `https://www.loopjeloopje.nl/` is één
landelijke tabel met alle evenementen in heel Nederland (372 op het moment van
schrijven), netjes gestructureerd (naam, datum+tijd, plaats als Google
Maps-link, afstanden — zie `lib/parseLoopjeLoopje.js`).

Om per evenement de provincie te bepalen, wordt élke plaatsnaam
opgezocht bij de **PDOK Locatieserver** — de gratis, publieke geocodeservice
van de Nederlandse overheid (gebaseerd op de BAG, dus officieel en
authoritatief, in tegenstelling tot een handmatig getypte plaatsenlijst) —
zie `lib/resolveProvince.js`. Resultaten worden gecachet in
`scraper/.cache/pdok-provinces.json` (niet in git, wel lokaal blijvend) zodat
niet elke run alle ~350 plaatsen opnieuw hoeft op te vragen.

Bij het opzetten (2026-09-22) leverde dit voor Noord-Nederland alleen al
**~215 extra evenementen** op die niet in runphy.nl of
hardloopkalendernederland.nl stonden — vooral kleinere, terugkerende
evenementen (trainingsloop-series, parkrun, clubwedstrijden) die de andere
twee bronnen niet apart bijhouden.

## inschrijven.nl: inschrijfplatform, lijst + formulier per evenement

Sinds november 2026 de vierde bron (zie `lib/parseInschrijven.js`). De
voorpagina zet alle evenementen als JSON in de pagina; een POST met
`type=l` geeft alleen de loopevenementen (±360 in Nederland per jaar).
Per evenement halen we het inschrijfformulier op (`/form/<id>-nl`, één
pagina per seconde): daar staan de onderdelen (afstanden) en soms een
voorwoord met het inschrijfgeld. robots.txt sluit alleen `/beheer/`,
`/wijzig/`, `/baan/` en oude jaren af.

- **Provincie** via PDOK op de plaatsnaam, net als loopjeloopje.nl.
- **Overgeslagen**: buitenland, competities/circuits ("Zeeuwse
  Crosscompetitie") en evenementen zonder echte plaats ("Meerdere
  plaatsen", een provincienaam).
- **Prijs**: staat meestal pas in de volgende formulierstap (na het kiezen
  van een onderdeel). Die zetten we bewust niet — dat zou een inschrijving
  starten. Noemt het voorwoord een bedrag, dan wordt dat een prijsvoorstel
  (`price_suggestion`), te beoordelen in het admin-paneel.
- **Dubbelen**: inschrijven.nl wordt als laatste verzameld, dus bij een
  dubbel met runphy/hardloopkalender/loopjeloopje blijft dat event staan.
  Noemt inschrijven.nl een loop anders ("58e Mosselloop" vs "Mosselloop
  Burgh-Haamstede"), dan kan hij als concept dubbel binnenkomen — dat zie je
  bij het nakijken van de concepten.
- **Niet alles is een wedstrijd**: er staan ook clinics en trainingen op
  (bv. "Loopclinics Runners Stadskanaal") — verwijderen bij het nakijken.
- **Eerste run**: ±150 nieuwe events, dus zet *Max* op 200.

## Wat de bronnen wél en niet vertellen

Alle drie bronnen zijn *aggregators*: overzichtspagina's die evenementen van
allerlei organisatoren samen tonen, niet de organisator-eigen website zelf.
Dat betekent dat alles wat de scraper aan een evenement toekent, beperkt is
tot wat er op díé overzichtspagina staat — niet wat er op de eigen site van
de organisator staat:

- **runphy.nl** geeft gestructureerde data (naam, datum, plaats, afstanden,
  een korte beschrijving) — betrouwbaar te lezen, zie `lib/parseRunphy.js`.
- **hardloopkalendernederland.nl** geeft alleen losse tekst zonder structuur
  — plaats en afstanden worden met patroonherkenning uit die tekst gehaald,
  zie de uitgebreide toelichting bovenaan `lib/parseHardloopkalender.js`.
  Plaats ontbreekt hier vaker.
- **loopjeloopje.nl** geeft, net als runphy.nl, gestructureerde data in een
  nette tabel — zie `lib/parseLoopjeLoopje.js`. De plaats staat er wel altijd
  bij (geen "plaats ontbreekt"-probleem), maar moet via de PDOK Locatieserver
  aan een provincie gekoppeld worden omdat de bron zelf geen provincie-indeling
  heeft (zie hierboven).
- **Geen van de drie bronnen bezoekt de organisator-eigen website.** Als een
  organisator op zijn eigen site wél een kidsrun, een Atletiekunie-keurmerk
  of een deelnemersaantal vermeldt, maar dat niet (duidelijk) terugkomt op
  runphy.nl of hardloopkalendernederland.nl zelf, dan ziet de scraper dat
  niet. Zie bijvoorbeeld **Kûbaarder Hurdrindei**: runphy.nl noemt alleen
  "5 km, 10,2 km, 21,1 km", terwijl de organisator (kubaarddorp.nl) daarnaast
  ook een kidsrun aanbiedt — dat gat is in dit geval niet te dichten zonder
  ook de organisator-site te bezoeken (per organisator een andere paginavorm,
  dus bewust niet gedaan; zie `lib/detectKidsrun.js`).
- `kidsrun` wordt sinds kort wel automatisch op `true` gezet als de bron
  **zelf al** iets kids-achtigs noemt in de naam of een van de
  afstanden/onderdelen (bv. "Kids 4 Mijl" of een apart "Kidsrun 1 km"-
  onderdeel) — zie `lib/detectKidsrun.js`. Dat vangt dus alleen de gevallen
  waar de bron het al vermeldt, niet elk evenement dat in werkelijkheid een
  kidsrun heeft.

**Controleer daarom sowieso** `type`, `kidsrun`, en of er een kidsrun/
Atletiekunie-keurmerk/capaciteit ontbreekt tijdens het reviewen in het
admin-paneel — zie ook "Bekende beperkingen" in `README.md`.

## Prijzen: entryfee.run

`entryfee-prices.js` haalt inschrijfgelden van `entryfee.run/nl/province/<slug>`
(12 provinciepagina's; Friesland heet daar `fryslan`). entryfee.run controleert
elke prijs dagelijks op de site van de organisator en toont hem per afstand.
Koppelen gaat op provincie + datum + naam/plaats: naam én plaats gelijk → prijs
direct ingevuld; één van beide → voorstel in het admin-paneel. Bestaande prijzen
worden niet overschreven. Bedragen boven € 60 bij afstanden t/m 21,1 km worden
genegeerd (dat zijn teamprijzen). Draait wekelijks in `suggest-prices.yml`,
vóór `suggest-prices.js`.

## hardlopen.nl (kalender van de Atletiekunie)

Vijfde bron, sinds 2026-11-04 (`lib/parseHardlopen.js`). Landelijke lijst
`/evenementen/?page=N` (10 per pagina) plus per evenement de detailpagina met
inschrijfgeld per afstand, jeugdonderdelen en organisatie. Provincie via PDOK.
Trainingslopen (clubtrainingen) worden overgeslagen; parkruns komen erin als
gratis parkloop. Levert ook het kenmerk "aangesloten bij de Atletiekunie"
(kolom `atletiekunie`, migratie 0010). `hardlopen-aanvullen.js` zet dat
kenmerk, en een lege organisator/prijs, bij evenementen die we al via een
andere bron hadden.
