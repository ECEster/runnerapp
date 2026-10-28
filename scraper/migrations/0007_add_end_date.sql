-- Voegt 'end_date' toe aan events: de laatste dag van een meerdaags evenement
-- (bv. Marathon Rotterdam: date = za 10 april, end_date = zo 11 april).
-- Leeg = eendaags. 'date' blijft de (eerste) dag, zodat alles wat op 'date'
-- sorteert of filtert blijft werken.
--
-- Eenmalig uit te voeren in de Supabase SQL editor van dit project. Veilig om
-- opnieuw te draaien.
alter table events add column if not exists end_date date;
alter table events drop constraint if exists events_end_date_after_date;
alter table events add constraint events_end_date_after_date
  check (end_date is null or end_date >= date);
