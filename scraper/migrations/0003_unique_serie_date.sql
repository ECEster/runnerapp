-- Voorkomt dat dezelfde editie van een terugkerend evenement twee keer in de
-- tabel komt te staan: een unieke combinatie van 'serie' en 'date'.
--
-- BELANGRIJK — volgorde: draai dit pas NADAT je scraper/migrations/0002_add_serie_editie.sql
-- hebt uitgevoerd én scraper/backfill-serie.js hebt gedraaid (eerst dry-run,
-- gemelde mogelijke dubbelen handmatig opgelost, dan --live) om 'serie' voor
-- alle bestaande rijen te vullen. Bestaan er op dat moment nog twee rijen met
-- dezelfde (serie, date), dan faalt onderstaande ALTER TABLE — los dat dan
-- eerst op in het admin-paneel voordat je dit opnieuw probeert.
--
-- Eenmalig uit te voeren in de Supabase SQL editor van dit project. Veilig om
-- opnieuw te draaien (de constraint wordt maar één keer toegevoegd).

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_serie_date_unique'
  ) then
    alter table events add constraint events_serie_date_unique unique (serie, date);
  end if;
end $$;
