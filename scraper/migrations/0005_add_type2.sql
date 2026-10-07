-- Voegt 'type2' toe aan events: een optioneel tweede type, voor evenementen
-- waar je uit twee soorten loop kunt kiezen (bijv. Trimloop Assen: trail of
-- baanevenement). De kaarten tonen het als tweede badge en de typefilters
-- matchen op type én type2.
--
-- Eenmalig uit te voeren in de Supabase SQL editor van dit project. Veilig om
-- opnieuw te draaien.
alter table events add column if not exists type2 text;
