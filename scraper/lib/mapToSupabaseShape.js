// Zet ons interne event-formaat om naar de vorm van de bestaande 'events'-tabel.
//
// Aannames / bewuste keuzes:
// - published: altijd false — nieuwe events komen in een wachtrij, jij publiceert handmatig
//   vanuit het admin-portaal.
// - type: we kunnen dit niet betrouwbaar afleiden uit de bronnen, dus krijgt voorlopig altijd
//   de placeholder 'wegevenement'. Omdat published:false is, staat dit nooit ongecontroleerd
//   live — je corrigeert dit (bv. naar 'trail' voor de Gaasterland Trail/Drenthe Trail Run)
//   tijdens het reviewen.
// - organizer (organisatienaam, tekst) laten we leeg: we hebben alleen een URL, geen naam.
// - distances: van array naar komma-string, zoals de rest van de tabel dat al doet.
// - source_url: NIEUWE kolom (nog toe te voegen via migratie), alleen voor het admin-portaal —
//   niet bedoeld om aan bezoekers te tonen.
export function mapToSupabaseShape(event) {
  return {
    name_nl: event.naam,
    date: event.datum,
    city: event.plaats,
    province: event.provincie,
    distances: event.afstanden.join(', '),
    registration_url: event.organisator_url,
    source_url: event.bron_url,
    image: event.afbeelding_url,
    type: 'wegevenement',
    organizer: null,
    published: false,
    kidsrun: false,
  }
}
