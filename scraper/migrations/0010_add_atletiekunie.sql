-- Aangesloten bij de Atletiekunie (bron: hardlopen.nl, de kalender van de
-- Atletiekunie). Gebruikt door het filter "Atletiekunie gecertificeerd".
alter table events add column if not exists atletiekunie boolean not null default false;
