begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  full_name text
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  website text,
  location text,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid,
  role_title text not null check (char_length(trim(role_title)) > 0),
  stage text not null default 'Applied' check (stage in ('Applied', 'OA', 'Interview', 'Offer')),
  status text not null default 'Active' check (status in ('Active', 'Rejected', 'Accepted', 'Withdrawn')),
  applied_at date,
  last_touch_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  constraint applications_company_owner_fkey
    foreign key (company_id, user_id)
    references public.companies (id, user_id)
);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  application_id uuid not null,
  due_at timestamptz not null,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  constraint follow_ups_application_owner_fkey
    foreign key (application_id, user_id)
    references public.applications (id, user_id)
    on delete cascade
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  application_id uuid not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint notes_application_owner_fkey
    foreign key (application_id, user_id)
    references public.applications (id, user_id)
    on delete cascade
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  application_id uuid not null,
  label text not null,
  url text not null,
  created_at timestamptz not null default now(),
  constraint links_application_owner_fkey
    foreign key (application_id, user_id)
    references public.applications (id, user_id)
    on delete cascade
);

create index if not exists companies_user_id_idx on public.companies (user_id);
create index if not exists applications_user_id_idx on public.applications (user_id);
create index if not exists applications_company_id_idx on public.applications (company_id);
create index if not exists applications_created_at_idx on public.applications (created_at desc);
create index if not exists follow_ups_user_due_at_idx on public.follow_ups (user_id, due_at asc);
create index if not exists follow_ups_open_due_at_idx on public.follow_ups (due_at asc) where completed_at is null;
create index if not exists notes_application_id_idx on public.notes (application_id);
create index if not exists links_application_id_idx on public.links (application_id);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.applications enable row level security;
alter table public.follow_ups enable row level security;
alter table public.notes enable row level security;
alter table public.links enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles
  for delete
  using (auth.uid() = id);

drop policy if exists "companies_select_own" on public.companies;
create policy "companies_select_own"
  on public.companies
  for select
  using (auth.uid() = user_id);

drop policy if exists "companies_insert_own" on public.companies;
create policy "companies_insert_own"
  on public.companies
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "companies_update_own" on public.companies;
create policy "companies_update_own"
  on public.companies
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "companies_delete_own" on public.companies;
create policy "companies_delete_own"
  on public.companies
  for delete
  using (auth.uid() = user_id);

drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own"
  on public.applications
  for select
  using (auth.uid() = user_id);

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own"
  on public.applications
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own"
  on public.applications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "applications_delete_own" on public.applications;
create policy "applications_delete_own"
  on public.applications
  for delete
  using (auth.uid() = user_id);

drop policy if exists "follow_ups_select_own" on public.follow_ups;
create policy "follow_ups_select_own"
  on public.follow_ups
  for select
  using (auth.uid() = user_id);

drop policy if exists "follow_ups_insert_own" on public.follow_ups;
create policy "follow_ups_insert_own"
  on public.follow_ups
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "follow_ups_update_own" on public.follow_ups;
create policy "follow_ups_update_own"
  on public.follow_ups
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "follow_ups_delete_own" on public.follow_ups;
create policy "follow_ups_delete_own"
  on public.follow_ups
  for delete
  using (auth.uid() = user_id);

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
  on public.notes
  for select
  using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
  on public.notes
  for delete
  using (auth.uid() = user_id);

drop policy if exists "links_select_own" on public.links;
create policy "links_select_own"
  on public.links
  for select
  using (auth.uid() = user_id);

drop policy if exists "links_insert_own" on public.links;
create policy "links_insert_own"
  on public.links
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "links_update_own" on public.links;
create policy "links_update_own"
  on public.links
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "links_delete_own" on public.links;
create policy "links_delete_own"
  on public.links
  for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

commit;
