-- Leeftijden voor de kidsrun/jeugdonderdelen, voor het leeftijdsfilter.
--   kids_min_age   jongste leeftijd die mee mag doen (null = onbekend)
--   kids_max_age   oudste leeftijd (null = onbekend)
--   kids_age_quote het zinnetje van de site waar de leeftijden uit komen
-- Geboortejaren ("geboren in 2015 of later") worden omgerekend naar leeftijd
-- in het jaar van het evenement (lib/extractKidsAges.js).
alter table events add column if not exists kids_min_age smallint check (kids_min_age is null or kids_min_age between 0 and 18);
alter table events add column if not exists kids_max_age smallint check (kids_max_age is null or kids_max_age between 0 and 18);
alter table events add column if not exists kids_age_quote text;
alter table events drop constraint if exists kids_age_order;
alter table events add constraint kids_age_order check (kids_min_age is null or kids_max_age is null or kids_min_age <= kids_max_age);
