-- Voegt source_url toe aan events: waar een gescraped evenement vandaan komt (bv. de
-- runphy.nl of hardloopkalendernederland.nl-pagina). Alleen voor het admin-portaal, niet
-- bedoeld om aan bezoekers te tonen.
--
-- Eenmalig uit te voeren in de Supabase SQL editor van dit project. Veilig om opnieuw te
-- draaien.
alter table events add column if not exists source_url text;
