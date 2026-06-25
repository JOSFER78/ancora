-- Hermes-style compact clinical memory for Ancora.
-- Stores synthesized, reviewable memory so chat does not load raw documents.

create table if not exists public.clinical_life_tree (
  patient_id uuid primary key references public.profiles(id) on delete cascade,
  tree_data jsonb not null default '{}'::jsonb,
  source_summary text,
  last_synthesized_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.clinical_timeline_index (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  event_date date,
  date_precision text not null default 'unknown' check (date_precision in ('exact', 'month', 'year', 'relative', 'unknown', 'none')),
  life_stage text not null default 'unknown',
  domain text not null default 'clinical',
  title text not null,
  description text not null,
  evidence_quotes jsonb not null default '[]'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  confidence numeric(4, 2) not null default 0.50 check (confidence >= 0 and confidence <= 1),
  status text not null default 'synthesized' check (status in ('synthesized', 'accepted', 'rejected')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.patient_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  snapshot_type text not null default 'clinical_chat',
  content text not null,
  summary jsonb not null default '{}'::jsonb,
  token_estimate integer not null default 0,
  source_counts jsonb not null default '{}'::jsonb,
  version text not null default 'hermes-clinical-v1',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.conversation_memory_updates (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  update_type text not null check (update_type in ('clinical_fact', 'timeline_event', 'life_tree', 'risk_event', 'question', 'profile_patch')),
  update_data jsonb not null,
  source_quote text,
  confidence numeric(4, 2) not null default 0.50 check (confidence >= 0 and confidence <= 1),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists clinical_timeline_index_patient_date_idx on public.clinical_timeline_index(patient_id, event_date, created_at);
create index if not exists patient_context_snapshots_patient_type_idx on public.patient_context_snapshots(patient_id, snapshot_type, created_at desc);
create index if not exists conversation_memory_updates_patient_status_idx on public.conversation_memory_updates(patient_id, status, created_at desc);

drop trigger if exists touch_clinical_life_tree_updated_at on public.clinical_life_tree;
create trigger touch_clinical_life_tree_updated_at before update on public.clinical_life_tree
for each row execute function public.touch_updated_at();

drop trigger if exists touch_clinical_timeline_index_updated_at on public.clinical_timeline_index;
create trigger touch_clinical_timeline_index_updated_at before update on public.clinical_timeline_index
for each row execute function public.touch_updated_at();

drop trigger if exists touch_conversation_memory_updates_updated_at on public.conversation_memory_updates;
create trigger touch_conversation_memory_updates_updated_at before update on public.conversation_memory_updates
for each row execute function public.touch_updated_at();

alter table public.clinical_life_tree enable row level security;
alter table public.clinical_timeline_index enable row level security;
alter table public.patient_context_snapshots enable row level security;
alter table public.conversation_memory_updates enable row level security;

drop policy if exists "Life tree visible to care team" on public.clinical_life_tree;
create policy "Life tree visible to care team"
on public.clinical_life_tree for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Life tree writable by care team" on public.clinical_life_tree;
create policy "Life tree writable by care team"
on public.clinical_life_tree for all to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Timeline index visible to care team" on public.clinical_timeline_index;
create policy "Timeline index visible to care team"
on public.clinical_timeline_index for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Timeline index writable by care team" on public.clinical_timeline_index;
create policy "Timeline index writable by care team"
on public.clinical_timeline_index for all to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Context snapshots visible to care team" on public.patient_context_snapshots;
create policy "Context snapshots visible to care team"
on public.patient_context_snapshots for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Context snapshots writable by care team" on public.patient_context_snapshots;
create policy "Context snapshots writable by care team"
on public.patient_context_snapshots for all to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Conversation memory visible to care team" on public.conversation_memory_updates;
create policy "Conversation memory visible to care team"
on public.conversation_memory_updates for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Conversation memory writable by care team" on public.conversation_memory_updates;
create policy "Conversation memory writable by care team"
on public.conversation_memory_updates for all to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));
