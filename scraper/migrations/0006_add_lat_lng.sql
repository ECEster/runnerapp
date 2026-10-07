-- Voegt coördinaten (lat/lng, WGS84) toe aan events, voor het postcode/straal-
-- filter op de agenda en regiopagina's. Gevuld door scraper/geocode-events.js
-- op basis van plaats + provincie (PDOK Locatieserver).
--
-- Eenmalig uit te voeren in de Supabase SQL editor van dit project. Veilig om
-- opnieuw te draaien.
alter table events add column if not exists lat double precision;
alter table events add column if not exists lng double precision;
