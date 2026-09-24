-- Voegt 'serie' en 'editie' toe aan events: 'serie' is een stabiele,
-- genormaliseerde herkenningsnaam die elk jaar gelijk blijft voor hetzelfde
-- terugkerende evenement (bv. "4-mijl-van-groningen"), 'editie' is het
-- (optionele) editienummer van deze specifieke rij.
--
-- Eenmalig uit te voeren in de Supabase SQL editor van dit project. Veilig om
-- opnieuw te draaien.
--
-- LET OP: dit bestand voegt NOG GEEN unique constraint toe op (serie, date).
-- Draai eerst scraper/backfill-serie.js (dry-run, controleer de gemelde
-- dubbelen, dan --live) om 'serie' voor bestaande rijen te vullen, en draai
-- pas daarna scraper/migrations/0003_unique_serie_date.sql.

alter table events add column if not exists serie text;
alter table events add column if not exists editie int4;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_editie_positive'
  ) then
    alter table events add constraint events_editie_positive check (editie > 0);
  end if;
end $$;
