# Bronnen per regio

Welke website(s) de scraper gebruikt om evenementen te verzamelen, per regio
zoals de site die zelf indeelt (Noord/Oost/Zuid/West — zie `admin-panel.html`
en de `regio-*.html`-pagina's).

## Overzicht

| Regio | Provincies | Actief? | Bronnen |
|---|---|---|---|
| **Noord** | Groningen, Friesland, Drenthe | ✅ Ja | runphy.nl + hardloopkalendernederland.nl |
| **Oost** | Overijssel, Gelderland, Flevoland | ❌ Nog niet | — |
| **Zuid** | Noord-Brabant, Limburg | ❌ Nog niet | — |
| **West** | Noord-Holland, Zuid-Holland, Utrecht, Zeeland | ❌ Nog niet | — |

**Alleen Noord wordt op dit moment daadwerkelijk gescraped** — dat is de enige
regio in `PROVINCES` in `lib/collectEvents.js`. Oost, Zuid en West staan er
nog niet in; evenementen daar moeten voorlopig nog met de hand worden
toegevoegd via het admin-paneel.

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

## Wat de bronnen wél en niet vertellen

Beide bronnen zijn *aggregators*: overzichtspagina's die evenementen van
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
- **Geen van beide bronnen bezoekt de organisator-eigen website.** Als een
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
