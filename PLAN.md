# Plan: RunningNL — HTML/CSS/JS Site (Phase 1)

## Context
Starting from an empty repo (only CLAUDE.md). Building a self-contained, browser-openable multi-page site in plain HTML/CSS/JS — no framework, no build tools, no server needed. Primary goal: a beautiful, functional demo that can be extended into Webflow later. Dutch primary language with EN toggle.

---

## Pages
1. `index.html` — Homepage
2. `agenda.html` — Full agenda with calendar + filters
3. `evenement.html` — Event detail page (reads `?id=XX` from URL, renders from shared data)

---

## Layout & UX

### Agenda page — two-view calendar
- **Monthly calendar view** (like Google Calendar): 7-column grid (Mon–Sun), colored dots on days that have events
- **Click a day** → day panel slides open below calendar showing event cards for that day
- Month navigation with prev/next arrows
- Active filters shown as dismissible chips above the calendar

### Event cards (shown in day panel + homepage featured row)
Each card shows: event image, name, city, distances, type badge, category icons, free/paid badge, "Meer info →" button linking to event detail page

### Event detail page
- Full-width hero image
- Event name (large), date, city, province
- Type badge + category badges
- Distance options, capacity
- Atletiekunie badge if applicable
- Free/paid + price
- Description (NL/EN)
- Registration button (links to `registration_url`)
- Embedded YouTube video if available
- Back to agenda link

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

---

## Design

**Vibe:** Sporty, clean, relatable, modern. Lots of bold imagery and video. Think Marathon Groningen energy meets ASICS cleanliness.

**Inspiration sites:** Zalando.nl, All4Running.nl, MarathonGroningen.nl, ASICS.com, SaatchiArt.com

**Colors:**
- Primary accent: `#E8400C` (bold orange-red)
- Dark: `#111827` (near-black for text/nav)
- Surface: `#F9FAFB` (off-white)
- White: `#FFFFFF`

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
style.css
data.js       ← events + postal code lookup table
i18n.js       ← all UI strings in NL + EN
```

---

## Sample Data — 19 Fictional Dutch Events

All dates in 2026 (March–June). Mix of small/large events, all provinces covered.

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

---

## Verification Checklist

1. Open `index.html` in browser — no server needed
2. Featured events row shows 4 soonest upcoming events
3. Click "Bekijk alle evenementen" → `agenda.html` loads
4. Calendar shows current month with colored dots on event days
5. Click a day with events → day panel slides open with cards
6. Apply each filter → calendar updates in real time
7. Active filter chips appear; clicking × removes individual filters
8. Click "Meer info" → `evenement.html?id=X` loads correct event
9. Toggle NL/EN button → all UI text and event content switches
10. Resize to mobile → layout adapts, filters collapse
