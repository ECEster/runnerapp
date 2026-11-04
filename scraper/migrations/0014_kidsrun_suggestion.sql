-- Kidsrun-voorstel van check-uitverkocht.js (dat ook de inschrijfpagina leest):
-- staat er een kidsrun op de site maar niet duidelijk genoeg om hem meteen aan
-- te zetten, dan komt het zinnetje hier en beoordeel je het in het admin-paneel.
--   kidsrun_suggestion_quote     het zinnetje van de site
--   kidsrun_suggestion_url       de pagina
--   kidsrun_suggestion_rejected  overgeslagen; niet opnieuw voorstellen
alter table events add column if not exists kidsrun_suggestion_quote text;
alter table events add column if not exists kidsrun_suggestion_url text;
alter table events add column if not exists kidsrun_suggestion_rejected boolean not null default false;
