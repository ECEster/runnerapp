-- Beschikbaarheid en inschrijfdeadline
--
--   sold_out                     helemaal uitverkocht (label "Uitverkocht" op de kaart)
--   sold_out_distances           volle onderdelen, vrije tekst, bv. "Kidsrun" of "Kidsrun, 10 km"
--   availability_checked_at      wanneer de uitverkocht-status voor het laatst is bevestigd
--   registration_deadline        laatste dag van de (voor)inschrijving
--   late_registration            inschrijven op de dag zelf mogelijk? (null = onbekend)
--   sold_out_suggestion          voorstel van check-uitverkocht.js: "uitverkocht" of de volle onderdelen
--   sold_out_suggestion_quote    het zinnetje van de site
--   sold_out_suggestion_url      de pagina waar het staat
--   sold_out_suggestion_rejected een overgeslagen voorstel; wordt niet opnieuw voorgesteld
alter table events add column if not exists sold_out boolean not null default false;
alter table events add column if not exists sold_out_distances text;
alter table events add column if not exists availability_checked_at date;
alter table events add column if not exists registration_deadline date;
alter table events add column if not exists late_registration boolean;
alter table events add column if not exists sold_out_suggestion text;
alter table events add column if not exists sold_out_suggestion_quote text;
alter table events add column if not exists sold_out_suggestion_url text;
alter table events add column if not exists sold_out_suggestion_rejected text;
