# RunningNederland

Tweetalige (Nederlands/Engels) agenda met hardloopevenementen in Nederland.
Live: https://nl-running.netlify.app

Statische HTML/JS-site op Netlify, met de evenementen in Supabase. De agenda
(`agenda.html`) is de startpagina.

## Kleuren

Alle kleuren staan als variabelen bovenaan [style.css](style.css) (`:root`).
Gebruik de variabele, niet de losse kleurcode.

### Saliegroen

| Variabele | Kleur | Waarvoor |
|---|---|---|
| `--salie` | `#B6B88D` | Alleen achtergrond en decoratie, zoals de weekdagenrij in de kalender en de streepjes links van de gegevens op de evenementpagina. Niet voor tekst (te weinig contrast op wit). |
| `--salie-tekst` | `#6B6D3F` | Donker olijfgroen voor tekst, zoals de datum op de eventcards. Contrast 5,4:1 op wit. |
| `--salie-lijn` | `#8A8C5F` | Randen en iconen in saliegroen. Contrast 3,5:1 op wit. |

`#6B6D3F` is ook het groen van de lettertegels (A, B, C) in de ontwerp-artifacts.

### Basiskleuren

| Variabele | Kleur | Waarvoor |
|---|---|---|
| `--accent` / `--btn` | `#2A3B5E` | Marineblauw: knoppen (zoals "Info & Inschrijven") en accenten |
| `--accent-dark` / `--btn-hover` | `#1E2B47` | Knop bij hover |
| `--dark` | `#111827` | Hoofdtekst |
| `--dark3` | `#374151` | Labels en secundaire tekst |
| `--mid` | `#6B7280` | Grijze hulptekst |
| `--light` | `#D1D5DB` | Lijnen |
| `--surface` | `#F9FAFB` | Achtergrond van de pagina |

De dag van vandaag in de kalender krijgt een transparante marine cirkel
(`rgba(42, 59, 94, 0.22)`, dus `#2A3B5E` op 22%).

### Labels per soort evenement

| Variabele | Kleur | Soorten |
|---|---|---|
| `--badge-weg` | `#1D4E89` (blauw) | Weg, stad, marathon |
| `--badge-natuur` | `#2D6A4F` (groen) | Trail, cross, bosloop, natuur |
| `--badge-baan` | `#6B3FA0` (paars) | Baan, coopertest, estafette |
| `--badge-multi` | `#0E7490` (petrol) | Swimrun, bike & run |
| `--badge-recreatief` | `#A21C5A` (framboos) | Funrun, parkloop, wandelen, inclusief |

Alle labelkleuren hebben minstens 5,3:1 contrast met witte tekst.

## Todo's (stand 11 november 2026)

Open punten uit de sessies van oktober en november 2026. Technische bouwpunten
voor de scraper staan ook in [scraper/README.md](scraper/README.md) onder
"Nog te bouwen".

### Keuzes die nog gemaakt moeten worden

- [ ] **Automatisch scrapen:** elke week nieuwe evenementen ophalen via GitHub Actions? Zo ja:
  meteen publiceren of eerst als concept? Nu alleen met de hand.
- [ ] **Snelwandelen:** mogen wedstrijden als het Wintercircuit snelwandelen en het NK snelwandelen
  in de agenda blijven?
- [ ] **Chiplabel leeftijd:** "Kind van 8 jaar" anders noemen, bijvoorbeeld "Leeftijd: 8 jaar"?
- [ ] **Datum op eventcards:** kleur blijft `#6B6D3F`; eventueel vetter maken?
- [ ] **Titels trainingsschema's:** voorstel 5 km "Na je eerste 2,5 km", 10 km "Je eerste 10K",
  42,2 km "Het ultieme doel".

### Gegevens opruimen en aanvullen

- [ ] **33 komende evenementen zonder inschrijflink** (vooral AV Texel, Le Champion, AV Zaanland,
  RRZ, DIJC-Bertus). In te vullen in het admin-paneel onder "Zonder inschrijflink".
- [ ] **Import van 4 november nakijken** (id 985–1304):
  - rare plaatsnamen, zoals "Aardenburg 12h30 3km - Max. 8km" en "Eiderberg 2, 8346 Kj Steenwijk-De Bult";
  - geen plaats bij id 995 en 1070;
  - te lange naam bij id 1070;
  - 3 evenementen nog zonder coördinaten.
- [ ] **Mogelijke dubbelen** (nooit verwijderen zonder akkoord):
  - Kootwijkerzand Trail tegenover Trail & Walk;
  - Vuurtorentrail (1079, 1180, 1259);
  - Pierewaai Trail (1025);
  - Singelcross (1169, 1170);
  - Berenloop (1084 en 986);
  - Devil's Trail (997 en 1120).
- [ ] **Soort evenement** staat vaak verkeerd; nalopen.
- [ ] **Voorstellen in het admin-paneel beoordelen:**
  - 84 prijsvoorstellen;
  - ongeveer 21 entryfee-voorstellen;
  - ongeveer 40 uitverkocht-voorstellen;
  - ongeveer 41 kidsrun-voorstellen.
- [ ] **Prijzen:** 575 komende evenementen hebben nog geen inschrijfgeld. Idee: de inschrijfpagina
  doorzoeken naar €-bedragen.

### Foto's en vormgeving

- [ ] **wegevenement2.jpg** (drie lopers in de zon): de startnummers zijn teruggedraaid, maar andere
  tekst op de foto staat mogelijk nog gespiegeld.
- [ ] **Regio-banners** (`images/regio-*-banner.jpg`) zonder de ingebakken kaart van Nederland.
  Originele foto's nodig, of bijsnijden.
- [ ] **Icoon schoen met hart** voor de knop Inloggen; het bestand van 22 oktober opnieuw aanleveren.
- [ ] **Rust-afvinklijst:** nog open zijn de bannertitel op één regel, het Atletiekunie-vinkje en de
  knopkleur.

### Testen

- [ ] **Bannervideo:** speelt hij in een echte browser één keer af en stopt hij dan?
- [ ] **Herinneringen per e-mail** end-to-end testen: aanzetten in Mijn Runs en de workflow
  send-reminders met de hand starten.
- [ ] **Supabase URL Configuration:**
  - Site URL instellen op `https://nl-running.netlify.app`;
  - redirect instellen op `…/mijnruns.html`;
  - daarna de inloglink testen.
- [ ] **Schemapagina op de telefoon** controleren.

### Toegankelijkheid (WCAG 2.2 AA)

- [ ] Skiplink toevoegen op alle pagina's.
- [ ] Dubbele `<h1>` op mijnruns.html en trainingsschemas.html nakijken.

### Later bouwen

- [ ] **Automatische controle:**
  - werken de links nog;
  - is een evenement volgeboekt;
  - is een evenement afgelast (met het label "Afgelast").
- [ ] **Organisatorsites bij het scrapen nalopen** op een jeugdloop, leeftijden en de soort evenement.
- [ ] **Serie/editie in productie zetten:** migraties 0002 en 0003 en `backfill-serie.js`, zie scraper/README.md.
- [ ] **Ingesproken trainingsschema's.**

## Lettertypes

- Koppen: Montserrat (zelfde letter als het logo)
- Tekst: Inter
