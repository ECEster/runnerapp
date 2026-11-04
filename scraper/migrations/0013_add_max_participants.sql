-- Maximaal aantal deelnemers (zoals de organisator het noemt), getoond op de
-- evenementpagina. Bron: hardlopen.nl ("Maximaal aantal deelnemers") of een
-- zin op de inschrijfpagina ("inschrijving stopt bij 500 deelnemers"), zie
-- scraper/lib/extractMaxParticipants.js.
alter table events add column if not exists max_participants integer check (max_participants is null or max_participants > 0);
