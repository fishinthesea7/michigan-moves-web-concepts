-- Michigan Moves prototype feedback: shared, public review comments.
-- Run this file once in the Supabase SQL Editor for the project used by the
-- GitHub Pages hub. The browser receives only the publishable key; never use a
-- secret or service-role key in the website files.

create extension if not exists pgcrypto;

create table if not exists public.prototype_comment_counters (
  page_id text primary key,
  next_number integer not null default 1 check (next_number > 0)
);

create table if not exists public.prototype_comments (
  id uuid primary key default gen_random_uuid(),
  page_id text not null check (page_id in (
    'get-involved-variation-a',
    'get-involved-variation-b',
    'directory-variation-a',
    'directory-variation-b'
  )),
  comment_number integer not null check (comment_number > 0),
  text text not null check (char_length(btrim(text)) between 1 and 5000),
  x_percent numeric(6,3) not null check (x_percent between 0 and 100),
  y numeric(10,2) not null check (y between 0 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, comment_number)
);

-- Upgrade an earlier prototype_comments table in place. CREATE TABLE IF NOT
-- EXISTS does not add newly introduced columns to a table that already exists.
alter table public.prototype_comments
  add column if not exists y numeric(10,2) default 80,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.prototype_comments set y = 80 where y is null;
update public.prototype_comments set created_at = now() where created_at is null;
update public.prototype_comments set updated_at = created_at where updated_at is null;

alter table public.prototype_comments
  alter column y set not null,
  alter column y drop default,
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prototype_comments'::regclass
      and conname = 'prototype_comments_y_bounds_check'
  ) then
    alter table public.prototype_comments
      add constraint prototype_comments_y_bounds_check
      check (y between 0 and 100000);
  end if;
end;
$$;

create index if not exists prototype_comments_page_order_idx
  on public.prototype_comments (page_id, comment_number);

create or replace function public.assign_prototype_comment_number()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.prototype_comment_counters (page_id, next_number)
  values (new.page_id, 2)
  on conflict (page_id) do update
    set next_number = public.prototype_comment_counters.next_number + 1
  returning next_number - 1 into new.comment_number;

  return new;
end;
$$;

create or replace function public.touch_prototype_comment_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assign_prototype_comment_number_trigger
  on public.prototype_comments;
create trigger assign_prototype_comment_number_trigger
before insert on public.prototype_comments
for each row execute function public.assign_prototype_comment_number();

drop trigger if exists touch_prototype_comment_updated_at_trigger
  on public.prototype_comments;
create trigger touch_prototype_comment_updated_at_trigger
before update on public.prototype_comments
for each row execute function public.touch_prototype_comment_updated_at();

alter table public.prototype_comments enable row level security;
alter table public.prototype_comment_counters enable row level security;

drop policy if exists "Public reviewers can read prototype comments"
  on public.prototype_comments;
create policy "Public reviewers can read prototype comments"
  on public.prototype_comments
  for select
  to anon
  using (true);

drop policy if exists "Public reviewers can create prototype comments"
  on public.prototype_comments;
create policy "Public reviewers can create prototype comments"
  on public.prototype_comments
  for insert
  to anon
  with check (true);

drop policy if exists "Public reviewers can edit prototype comments"
  on public.prototype_comments;
create policy "Public reviewers can edit prototype comments"
  on public.prototype_comments
  for update
  to anon
  using (true)
  with check (true);

drop policy if exists "Public reviewers can delete prototype comments"
  on public.prototype_comments;
create policy "Public reviewers can delete prototype comments"
  on public.prototype_comments
  for delete
  to anon
  using (true);

revoke all on public.prototype_comment_counters from anon, authenticated;
revoke all on public.prototype_comments from anon, authenticated;
grant select on public.prototype_comments to anon;
grant insert (page_id, text, x_percent, y) on public.prototype_comments to anon;
grant update (text, x_percent, y) on public.prototype_comments to anon;
grant delete on public.prototype_comments to anon;

revoke all on function public.assign_prototype_comment_number() from public;
revoke all on function public.touch_prototype_comment_updated_at() from public;

-- Make the new columns visible to the REST API immediately after this script.
notify pgrst, 'reload schema';
