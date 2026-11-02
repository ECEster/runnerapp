-- Prijsvoorstellen: suggest-prices.js zoekt het inschrijfgeld op de
-- organisatorsite en zet het hier klaar. Pas als je in het admin-paneel op
-- "Overnemen" klikt, wordt het de echte prijs (kolom 'price').
--
--   price_suggestion           het gevonden bedrag, bv. "5 - 12,50"
--   price_suggestion_quote     het zinnetje van de site waar het bedrag uit komt
--   price_suggestion_url       de pagina waar het zinnetje staat
--   price_suggestion_rejected  een overgeslagen voorstel; wordt niet opnieuw voorgesteld
--   price_checked_at           wanneer de site voor het laatst is bekeken
--
-- Eenmalig uit te voeren in de Supabase SQL editor van dit project. Veilig om
-- opnieuw te draaien.
alter table events add column if not exists price_suggestion text;
alter table events add column if not exists price_suggestion_quote text;
alter table events add column if not exists price_suggestion_url text;
alter table events add column if not exists price_suggestion_rejected text;
alter table events add column if not exists price_checked_at timestamptz;
