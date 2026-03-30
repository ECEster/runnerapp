# Plan: runningnederland.nl — HTML/CSS/JS Site (Phase 1)

## Context
Starting from an empty repo (only CLAUDE.md). Building a self-contained, browser-openable multi-page site in plain HTML/CSS/JS — no framework, no build tools, no server needed. Primary goal: a beautiful, functional demo that can be extended into Webflow later. Dutch primary language with EN toggle.

Site name: **runningnederland.nl** (logo placeholder in nav)
Organizing body: **Golanzo**

---

## Pages

1. `index.html` — Homepage
2. `agenda.html` — Full agenda with calendar + filters
3. `evenement.html` — Event detail page (reads `?id=XX` from URL, renders from shared data)
4. `trainingsschemas.html` — Pre-made training schedules
5. `mijnruns.html` — Personal run log (login required)
6. `fotos.html` — Per-event public photo gallery
7. `kids.html` — Kids runs page (up to 15 years)
8. `overons.html` — About us (simple text)
9. `contact.html` — Contact page (intro text + contact form)

---

## Navigation

Agenda | Trainingsschema's | Kids Runs | Foto's | Mijn Runs | Over ons | Contact

- Logo placeholder + "runningnederland.nl" in nav
- Language toggle (NL/EN)
- "Mijn Runs" links to login if not authenticated

---

## Layout & UX

### Homepage (`index.html`)
- **Hero section**: full-width photo of forest ground with muddy calves and different kinds of walking/running shoes. Site name overlaid on top.
- **Featured events row**: 4 soonest upcoming events
- **About Golanzo section**: short intro text about the organizing organization

### Agenda page — two-view calendar
- **Monthly calendar view** (like Google Calendar): 7-column grid (Mon–Sun), colored dots on days that have events
- **Click a day** → day panel slides open below calendar showing event cards for that day
- Month navigation with prev/next arrows
- Active filters shown as dismissible chips above the calendar

### Event cards (shown in day panel + homepage featured row)
Each card shows: event image (placeholder running photo), event name, city, distances, type badge, category icons, free/paid badge, organizer name, "Meer info →" button linking to event detail page

### Event detail page
- Full-width hero image
- Event name (large), date, city, province
- Type badge + category badges
- Distance options, capacity
- Atletiekunie badge if applicable
- Free/paid + price
- Organizer name (e.g. "Georganiseerd door: Golanzo")
- Description (NL/EN)
- Registration button (links to `registration_url`)
- Embedded YouTube video if available
- Per-event photo gallery (publicly uploaded, admin-approved)
- Back to agenda link

### Training schedules page (`trainingsschemas.html`)
- Pre-made weekly plan tables for: 2.5km, 5km, 7.5km, 10km, 15km, 20km, 24km, Marathon
- Each schedule includes:
  - Weekly plan table (e.g. Week 1: run 3×10 min)
  - Warm-up tips
  - Stretch tips

### Mijn Runs page (`mijnruns.html`)
- Requires login
- Features:
  - Log a run (date, distance, time, notes)
  - View run history
  - Save favourite events
  - Upload photos from events

### Photo gallery page (`fotos.html`)
- Organised per event
- Anyone can upload photos (no login required)
- Photos must be approved by admin (Ester) before going public

### Kids runs page (`kids.html`)
- Bright, happy colours and fun design
- Content sections:
  - Shoes advice for kids
  - Clothing advice
  - How to make running fun
  - Perks of running for kids
  - Kids' physiology — what to do and not to do
- For kids up to 15 years (no age group splits)
- Kids events from the main agenda also displayed here

### About us page (`overons.html`)
- Simple text page about runningnederland.nl / Golanzo

### Contact page (`contact.html`)
- Short intro text
- Contact form

---

## Filters (agenda page)

| Filter | Type | Options |
|--------|------|---------|
| Naam evenement | Text input | Free search |
| Plaatsnaam | Text input | Free search |
| Provincie | Dropdown | All 12 Dutch provinces |
| Afstand van postcode | Text input + km slider | Postcode (4 digits) + radius in km |
| Datum van/tot | Date range picker | — |
| Type evenement | Multi-select pills | wegevenement, trail, cross, estafette, coopertest, ultrarun, survivalrun, funrun, virtuele run, parkloop, studentenevenement, marathon, sportief wandelen, inclusieve runs en wandelingen, gecertificeerd parcours |
| Afstand loop | Multi-select pills | <5km, 5km, 10km, 15km, 21km, 42km, >42km |
| Categorie | Multi-select pills | Heren, Dames, Jeugd, Business Run, Aangepast Sporten |
| Atletiekunie wedstrijd | Toggle | Alle / Ja / Nee |
| Deelname | Toggle | Alle / Gratis / Betaald |
| Grootte evenement | Pills | Alle / Klein (<500) / Middel (500–2.000) / Groot (>2.000) |

All filters update the calendar in real time. "Filters wissen" button resets all.
On mobile: filters stack vertically.

---

## Design

**Vibe:** Sporty, clean, relatable, modern. Lots of bold imagery and video. Think Marathon Groningen energy meets ASICS cleanliness.

**Inspiration sites:** Zalando.nl, All4Running.nl, MarathonGroningen.nl, ASICS.com, SaatchiArt.com

**Colors:**
- Primary accent: `#E8400C` (bold orange-red)
- Dark: `#111827` (near-black for text/nav)
- Surface: `#F9FAFB` (off-white)
- White: `#FFFFFF`
- Kids page: bright, happy colours (distinct palette)

**Typography:**
- `Barlow Condensed 800` — headings (sporty, tight)
- `Inter 400/500/600` — body text
- Both via Google Fonts CDN

**Event type badge colors:**
- marathon: red `#DC2626`
- trail: green `#15803D`
- cross: brown `#92400E`
- wegevenement: blue `#1D4ED8`
- parkloop: teal `#059669`
- funrun: amber `#D97706`
- survivalrun: purple `#7C3AED`
- ultrarun: pink-red `#BE185D`
- virtuele run: cyan `#0891B2`
- estafette: blue `#0369A1`
- coopertest: indigo `#4F46E5`
- studentenevenement: violet `#6D28D9`
- sportief wandelen: lime `#65A30D`
- inclusieve runs: pink `#EC4899`
- gecertificeerd parcours: amber-dark `#B45309`

**Key images:**
- Hero (homepage): forest ground, muddy calves, various running/walking shoes
- Footer: road with one pair of runner feet in bright coloured running shoes
- Event cards: placeholder running photos from Unsplash

---

## Language Toggle (NL/EN)

- `i18n.js` — two objects: `nl` and `en` with all UI strings
- `lang` stored in `localStorage`
- Toggle button in nav switches all UI text instantly
- Event content: `name_nl`/`name_en` and `description_nl`/`description_en` from data

---

## Files to Create

```
index.html
agenda.html
evenement.html
trainingsschemas.html
mijnruns.html
fotos.html
kids.html
overons.html
contact.html
style.css
kids.css          ← separate bright stylesheet for kids page
data.js           ← events + postal code lookup table
i18n.js           ← all UI strings in NL + EN
```

---

## Sample Data — 19 Fictional Dutch Events

All dates in 2026 (March–June). Mix of small/large events, all provinces covered.
Each event includes an `organizer` field (e.g. "Golanzo").

| # | Name | Date | Type | City | Province | Distances | Paid | Atletiekunie | Capacity |
|---|------|------|------|------|----------|-----------|------|--------------|----------|
| 1 | Groninger Crossloop | 29 mrt | cross | Groningen | Groningen | 8km | €10 | ✓ | 300 |
| 2 | Utrecht Studentenloop | 4 apr | studentenevenement | Utrecht | Utrecht | 5/10km | €8 | ✗ | 600 |
| 3 | Rotterdam Parkloop | 4 apr | parkloop | Rotterdam | Zuid-Holland | 5km | gratis | ✗ | 250 |
| 4 | Leiden Lenteloop | 12 apr | wegevenement | Leiden | Zuid-Holland | 5/10km | €15/20 | ✓ | 800 |
| 5 | Virtuele Voorjaarsloop | 15 apr | virtuele run | (online) | Noord-Holland | 5/10/21km | €15 | ✗ | 10.000 |
| 6 | Inclusieve Wandeling Delft | 19 apr | inclusieve runs | Delft | Zuid-Holland | 5km | gratis | ✗ | 150 |
| 7 | Arnhem Sportief Wandelen | 19 apr | sportief wandelen | Arnhem | Gelderland | 10/20km | €12 | ✗ | 400 |
| 8 | Haarlem 10K Klassiek | 26 apr | gecertificeerd parcours | Haarlem | Noord-Holland | 10km | €18 | ✓ | 2.500 |
| 9 | Eindhoven Kleurenfestival | 26 apr | funrun | Eindhoven | Noord-Brabant | 5km | gratis | ✗ | 1.200 |
| 10 | Zwolle Coopertest | 2 mei | coopertest | Zwolle | Overijssel | 12 min | €8 | ✓ | 100 |
| 11 | Amsterdam Trail Classic | 10 mei | trail | Amsterdam | Noord-Holland | 15/30km | €35/55 | ✗ | 400 |
| 12 | Zeeland Survival Run | 16 mei | survivalrun | Middelburg | Zeeland | 8km | €25 | ✗ | 250 |
| 13 | Maastricht Marathon | 17 mei | marathon | Maastricht | Limburg | 10/21/42km | €25/45/75 | ✓ | 5.000 |
| 14 | Den Haag Estafette | 24 mei | estafette | Den Haag | Zuid-Holland | 4×5km | €20pp | ✗ | 1.000 |
| 15 | Drenthe Trail Run | 31 mei | trail | Assen | Drenthe | 20km | €30 | ✗ | 300 |
| 16 | Nijmeegse Nachtloop | 7 jun | wegevenement | Nijmegen | Gelderland | 10/15km | €22/28 | ✗ | 1.500 |
| 17 | Friesland Ultrarun | 14 jun | ultrarun | Leeuwarden | Friesland | 50/100km | €60/90 | ✗ | 200 |
| 18 | Rotterdam Business Run | 18 jun | wegevenement | Rotterdam | Zuid-Holland | 5km | €35 | ✗ | 2.000 |
| 19 | Almere Parkloop Special | 20 jun | parkloop | Almere | Flevoland | 5km | gratis | ✗ | 300 |

**Province coverage:** all 12 provinces ✓
**Type coverage:** all 15 event types ✓
**Category spread:** Heren/Dames throughout; Jeugd (#2, #10); Business Run (#18); Aangepast Sporten (#6, #7)

### Postal code lookup
`data.js` includes a lookup table of ~100 Dutch 4-digit postal code prefixes → lat/lng coordinates, covering all major cities. Haversine formula used for distance calculation client-side.

---

## Technical Notes

- No ES modules (file:// compatibility) — all scripts loaded as regular `<script>` tags with globals
- `EVENTS` and `I18N` are global variables from `data.js` and `i18n.js`
- Postal code filter: 4-digit prefix lookup → Haversine distance calculation
- Calendar: pure JS DOM rendering, no library
- Photo upload: form submission stored locally for demo; admin approval flow simulated
- Login/auth: simulated for Phase 1 demo (no real backend)

---

## Verification Checklist

1. Open `index.html` in browser — no server needed
2. Hero image visible, site name overlaid
3. Featured events row shows 4 soonest upcoming events
4. About Golanzo section visible below featured events
5. Click "Bekijk alle evenementen" → `agenda.html` loads
6. Calendar shows current month with colored dots on event days
7. Click a day with events → day panel slides open with cards
8. Apply each filter → calendar updates in real time
9. Active filter chips appear; clicking × removes individual filters
10. Click "Meer info" → `evenement.html?id=X` loads correct event
11. Event detail shows organizer name
12. Per-event photo gallery visible on event detail page
13. Toggle NL/EN button → all UI text and event content switches
14. Resize to mobile → layout adapts, filters stack vertically
15. `trainingsschemas.html` shows all 8 distance plans with warm-up & stretch tips
16. `kids.html` loads with bright colours, tips sections, and kids events
17. `fotos.html` shows per-event galleries
18. `contact.html` shows intro text and working contact form
