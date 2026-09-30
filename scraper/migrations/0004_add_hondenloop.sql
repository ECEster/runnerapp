-- Voegt 'hondenloop' toe aan events: een los aan te vinken kenmerk (net als
-- 'kidsrun'), geen apart Type — een hondenloop-onderdeel komt voor bij allerlei
-- typen evenementen (wegevenement, parkloop, etc.), niet als evenement op
-- zichzelf.
--
-- Eenmalig uit te voeren in de Supabase SQL editor van dit project. Veilig om
-- opnieuw te draaien.
alter table events add column if not exists hondenloop boolean not null default false;
