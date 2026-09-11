-- supabase-schema.sql — runningnederland.nl
--
-- Eenmalig uit te voeren in de Supabase SQL editor van dit project
-- (https://supabase.com/dashboard/project/tcitvbeoddwanyljpcuo/sql/new).
-- Voegt de tabellen toe die nodig zijn voor "Mijn Runs" (runs + favorieten,
-- gekoppeld aan Supabase Auth) en het contactformulier.
--
-- Veilig om opnieuw te draaien: alle statements zijn "if not exists".

-- ─── Provincie optioneel maken op bestaande events-tabel ────────────────
-- Veiligheidsnet: als de kolom nog NOT NULL staat, kan een evenement zonder
-- provincie niet worden opgeslagen. Dit statement is een no-op als de kolom
-- al nullable is.
alter table events alter column province drop not null;

-- ─── Runs (hardloophistorie per gebruiker) ──────────────────────────────
create table if not exists runs (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date        date not null,
  distance    numeric not null,
  time        text,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table runs enable row level security;

drop policy if exists "Users can view own runs" on runs;
create policy "Users can view own runs" on runs
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own runs" on runs;
create policy "Users can insert own runs" on runs
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own runs" on runs;
create policy "Users can delete own runs" on runs
  for delete using (auth.uid() = user_id);

-- ─── Favorites (opgeslagen evenementen per gebruiker) ───────────────────
create table if not exists favorites (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_id    bigint not null,
  created_at  timestamptz not null default now(),
  unique (user_id, event_id)
);

alter table favorites enable row level security;

drop policy if exists "Users can view own favorites" on favorites;
create policy "Users can view own favorites" on favorites
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorites" on favorites;
create policy "Users can insert own favorites" on favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on favorites;
create policy "Users can delete own favorites" on favorites
  for delete using (auth.uid() = user_id);

-- ─── Contact messages (van het contactformulier) ────────────────────────
create table if not exists contact_messages (
  id          bigint generated always as identity primary key,
  name        text not null,
  email       text not null,
  subject     text,
  message     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table contact_messages enable row level security;

-- Iedereen (ook niet-ingelogde bezoekers) mag een bericht versturen.
drop policy if exists "Anyone can submit a contact message" on contact_messages;
create policy "Anyone can submit a contact message" on contact_messages
  for insert with check (true);

-- Bewust geen select-policy voor anon/authenticated: berichten zijn alleen
-- leesbaar via de service role (dashboard) of een latere ingelogde-admin-policy.
