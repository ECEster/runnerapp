// Probeert te herkennen of een evenement een obstakel-/survivalrun is, op
// basis van de naam — dezelfde aanpak als lib/detectKidsrun.js: we kunnen
// alleen iets herkennen wat de bron zelf al in de naam noemt (bv.
// "IntersportObstacleRun"). Geen match => 'survivalrun' wordt niet gegokt,
// de scraper valt dan terug op de gewone 'wegevenement'-placeholder (zie
// mapToSupabaseShape.js) en jij corrigeert het type tijdens het reviewen
// als de bron het zelf niet in de naam vermeldt.
const SURVIVAL_KEYWORDS = [
  'survival', 'obstakel', 'obstacle', 'ocr', 'mudrun', 'mud run',
  'tough mudder', 'spartan', 'bootcamp',
]

export function detectSurvivalrun(event) {
  const naam = (event.naam ?? '').toLowerCase()
  return SURVIVAL_KEYWORDS.some((keyword) => naam.includes(keyword))
}
