-- Herinneringen per e-mail voor opgeslagen runs (Mijn Runs).
--
-- reminder_settings: per gebruiker aan/uit, hoeveel dagen van tevoren, en of
--   er ook een herinnering komt vlak voor de inschrijfdeadline. Gebruikers
--   lezen/schrijven alleen hun eigen rij (RLS).
-- reminder_log: welke herinneringen al verstuurd zijn, zodat niemand dezelfde
--   twee keer krijgt. Alleen voor scraper/send-reminders.js (service role);
--   geen policies, dus niet leesbaar voor gebruikers.
create table if not exists reminder_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  days_before integer not null default 3 check (days_before in (1, 2, 3, 7, 14)),
  deadline_reminder boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table reminder_settings enable row level security;
create policy "Users can view own reminder settings" on reminder_settings for select using (auth.uid() = user_id);
create policy "Users can insert own reminder settings" on reminder_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own reminder settings" on reminder_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists reminder_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id bigint not null,
  kind text not null check (kind in ('event', 'deadline')),
  sent_at timestamptz not null default now(),
  primary key (user_id, event_id, kind)
);
alter table reminder_log enable row level security;
