-- VeriLit: saved reviews per user.
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Row Level Security makes every row visible and editable only by its owner.

create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 300),
  topic        text not null default '' check (char_length(topic) <= 500),
  settings     jsonb not null default '{}'::jsonb,
  papers       jsonb not null default '[]'::jsonb,
  paper_count  integer not null default 0 check (paper_count between 0 and 200),
  draft        text not null default '' check (char_length(draft) <= 200000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists reviews_user_updated_idx on public.reviews (user_id, updated_at desc);

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_own" on public.reviews;
drop policy if exists "reviews_insert_own" on public.reviews;
drop policy if exists "reviews_update_own" on public.reviews;
drop policy if exists "reviews_delete_own" on public.reviews;

create policy "reviews_select_own" on public.reviews
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reviews_insert_own" on public.reviews
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reviews_update_own" on public.reviews
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reviews_delete_own" on public.reviews
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Keep updated_at current on every edit.
create or replace function public.reviews_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists reviews_touch on public.reviews;
create trigger reviews_touch before update on public.reviews
  for each row execute function public.reviews_touch();

-- Only signed-in users reach this table, and RLS limits them to their own rows.
revoke all on public.reviews from anon;
grant select, insert, update, delete on public.reviews to authenticated;
