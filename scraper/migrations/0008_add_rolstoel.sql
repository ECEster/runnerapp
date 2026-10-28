-- Voegt 'rolstoel' toe aan events: het evenement heeft een categorie of
-- startgroep voor rolstoelatleten en/of handbikers (net als 'kidsrun' een los
-- kenmerk, geen apart type). Gevuld via het adminpaneel en, als het in de naam
-- staat, door de scraper.
--
-- Eenmalig uit te voeren in de Supabase SQL editor van dit project. Veilig om
-- opnieuw te draaien.
alter table events add column if not exists rolstoel boolean not null default false;
