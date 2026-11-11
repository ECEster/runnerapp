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

## Lettertypes

- Koppen: Montserrat (zelfde letter als het logo)
- Tekst: Inter
