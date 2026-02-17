begin;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid,
  name text not null check (char_length(trim(name)) > 0),
  email text,
  linkedin text,
  role text,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  constraint contacts_company_owner_fkey
    foreign key (company_id, user_id)
    references public.companies (id, user_id)
);

create table if not exists public.application_contacts (
  application_id uuid not null,
  contact_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (application_id, contact_id),
  constraint application_contacts_application_owner_fkey
    foreign key (application_id, user_id)
    references public.applications (id, user_id)
    on delete cascade,
  constraint application_contacts_contact_owner_fkey
    foreign key (contact_id, user_id)
    references public.contacts (id, user_id)
    on delete cascade
);

create table if not exists public.stage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  application_id uuid not null,
  from_stage text,
  to_stage text not null,
  changed_at timestamptz not null default now(),
  constraint stage_events_application_owner_fkey
    foreign key (application_id, user_id)
    references public.applications (id, user_id)
    on delete cascade
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.application_tags (
  application_id uuid not null,
  tag_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (application_id, tag_id),
  constraint application_tags_application_owner_fkey
    foreign key (application_id, user_id)
    references public.applications (id, user_id)
    on delete cascade,
  constraint application_tags_tag_owner_fkey
    foreign key (tag_id, user_id)
    references public.tags (id, user_id)
    on delete cascade
);

create unique index if not exists tags_user_name_unique_idx on public.tags (user_id, lower(name));
create index if not exists contacts_user_id_idx on public.contacts (user_id);
create index if not exists contacts_company_id_idx on public.contacts (company_id);
create index if not exists application_contacts_user_id_idx on public.application_contacts (user_id);
create index if not exists stage_events_user_changed_at_idx on public.stage_events (user_id, changed_at desc);
create index if not exists stage_events_application_id_idx on public.stage_events (application_id);
create index if not exists application_tags_user_id_idx on public.application_tags (user_id);

alter table public.contacts enable row level security;
alter table public.application_contacts enable row level security;
alter table public.stage_events enable row level security;
alter table public.tags enable row level security;
alter table public.application_tags enable row level security;

drop policy if exists "contacts_select_own" on public.contacts;
create policy "contacts_select_own"
  on public.contacts
  for select
  using (auth.uid() = user_id);

drop policy if exists "contacts_insert_own" on public.contacts;
create policy "contacts_insert_own"
  on public.contacts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "contacts_update_own" on public.contacts;
create policy "contacts_update_own"
  on public.contacts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "contacts_delete_own" on public.contacts;
create policy "contacts_delete_own"
  on public.contacts
  for delete
  using (auth.uid() = user_id);

drop policy if exists "application_contacts_select_own" on public.application_contacts;
create policy "application_contacts_select_own"
  on public.application_contacts
  for select
  using (auth.uid() = user_id);

drop policy if exists "application_contacts_insert_own" on public.application_contacts;
create policy "application_contacts_insert_own"
  on public.application_contacts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "application_contacts_update_own" on public.application_contacts;
create policy "application_contacts_update_own"
  on public.application_contacts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "application_contacts_delete_own" on public.application_contacts;
create policy "application_contacts_delete_own"
  on public.application_contacts
  for delete
  using (auth.uid() = user_id);

drop policy if exists "stage_events_select_own" on public.stage_events;
create policy "stage_events_select_own"
  on public.stage_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "stage_events_insert_own" on public.stage_events;
create policy "stage_events_insert_own"
  on public.stage_events
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "stage_events_update_own" on public.stage_events;
create policy "stage_events_update_own"
  on public.stage_events
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "stage_events_delete_own" on public.stage_events;
create policy "stage_events_delete_own"
  on public.stage_events
  for delete
  using (auth.uid() = user_id);

drop policy if exists "tags_select_own" on public.tags;
create policy "tags_select_own"
  on public.tags
  for select
  using (auth.uid() = user_id);

drop policy if exists "tags_insert_own" on public.tags;
create policy "tags_insert_own"
  on public.tags
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "tags_update_own" on public.tags;
create policy "tags_update_own"
  on public.tags
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tags_delete_own" on public.tags;
create policy "tags_delete_own"
  on public.tags
  for delete
  using (auth.uid() = user_id);

drop policy if exists "application_tags_select_own" on public.application_tags;
create policy "application_tags_select_own"
  on public.application_tags
  for select
  using (auth.uid() = user_id);

drop policy if exists "application_tags_insert_own" on public.application_tags;
create policy "application_tags_insert_own"
  on public.application_tags
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "application_tags_update_own" on public.application_tags;
create policy "application_tags_update_own"
  on public.application_tags
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "application_tags_delete_own" on public.application_tags;
create policy "application_tags_delete_own"
  on public.application_tags
  for delete
  using (auth.uid() = user_id);

commit;
