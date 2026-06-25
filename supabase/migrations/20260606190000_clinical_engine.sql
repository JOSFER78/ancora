-- Motor clinico real de Ancora.
-- Crea memoria clinica persistente, documentos privados y bandeja de propuestas IA.

create extension if not exists pgcrypto;

create or replace function public.is_ancora_owner()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'josferestudio@gmail.com'
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), '')
$$;

create or replace function public.is_clinical_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_ancora_owner()
    or public.current_profile_role() in ('admin', 'supervisor')
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.psychologist_patient_links (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  psychologist_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  source text not null default 'manual',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (patient_id, psychologist_id)
);

create table if not exists public.clinical_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  bucket_id text not null default 'clinical-documents',
  storage_path text,
  file_name text not null,
  mime_type text,
  file_size bigint,
  source_kind text not null default 'upload' check (source_kind in ('upload', 'manual_name', 'chat_session')),
  extraction_status text not null default 'pending' check (extraction_status in ('pending', 'processing', 'ready', 'error')),
  extraction_error text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (storage_path)
);

create table if not exists public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.clinical_documents(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  extracted_text text,
  document_summary text,
  extraction_model text,
  schema_version text not null default 'clinical-extractor-v1',
  status text not null default 'ready' check (status in ('ready', 'error')),
  error text,
  raw_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (document_id)
);

create table if not exists public.clinical_proposals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  document_id uuid references public.clinical_documents(id) on delete set null,
  extraction_id uuid references public.document_extractions(id) on delete set null,
  proposal_type text not null check (proposal_type in ('timeline_event', 'medication', 'clinical_fact', 'profile_patch', 'risk_event', 'question')),
  proposal_data jsonb not null,
  source_quote text,
  confidence numeric(4, 2) not null default 0.50 check (confidence >= 0 and confidence <= 1),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.clinical_facts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  document_id uuid references public.clinical_documents(id) on delete set null,
  extraction_id uuid references public.document_extractions(id) on delete set null,
  proposal_id uuid references public.clinical_proposals(id) on delete set null,
  kind text not null,
  claim text not null,
  verbatim_quote text,
  date_value date,
  date_precision text not null default 'unknown' check (date_precision in ('exact', 'month', 'year', 'relative', 'unknown', 'none')),
  confidence numeric(4, 2) not null default 0.50 check (confidence >= 0 and confidence <= 1),
  authority_level integer not null default 4 check (authority_level between 1 and 4),
  source_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.clinical_profiles (
  patient_id uuid primary key references public.profiles(id) on delete cascade,
  summary_vital text,
  psychological_history text,
  medical_history text,
  relationship_context text,
  patterns text,
  goals text,
  risk_summary text,
  open_questions jsonb not null default '[]'::jsonb,
  last_synthesized_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  event_date date,
  date_precision text not null default 'unknown' check (date_precision in ('exact', 'month', 'year', 'relative', 'unknown', 'none')),
  event_type text not null default 'other' check (event_type in ('vital_event', 'symptom_start', 'medication_change', 'crisis', 'therapy_session', 'document_upload', 'clinical_observation', 'other')),
  description text not null,
  associated_emotion text,
  intensity integer check (intensity between 1 and 10),
  authority_level integer not null default 3 check (authority_level between 1 and 4),
  validated_by uuid references auth.users(id) on delete set null,
  source_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  dose text,
  frequency text,
  prescriber text,
  status text not null default 'active' check (status in ('active', 'historical', 'unknown')),
  authority_level integer not null default 3 check (authority_level between 1 and 4),
  validated_by uuid references auth.users(id) on delete set null,
  source_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.risk_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  document_id uuid references public.clinical_documents(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  risk_type text not null,
  severity text not null check (severity in ('low', 'moderate', 'high', 'critical')),
  evidence_quote text,
  recommended_action text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'closed')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  psychologist_id uuid references public.profiles(id) on delete set null,
  week_start date not null,
  raw_summary text,
  ai_summary text,
  psychologist_notes text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'archived')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  patient_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.can_access_patient(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = target_patient_id
    or public.is_clinical_admin()
    or exists (
      select 1
      from public.psychologist_patient_links ppl
      where ppl.patient_id = target_patient_id
        and ppl.psychologist_id = auth.uid()
        and ppl.status = 'active'
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = target_patient_id
        and p.contexto_terapeutico ->> 'assigned_psychologist_id' = auth.uid()::text
    )
    or exists (
      select 1
      from public.appointments a
      where a.patient_id = target_patient_id
        and a.psychologist_id = auth.uid()
    )
$$;

create index if not exists clinical_documents_patient_created_idx on public.clinical_documents(patient_id, created_at desc);
create index if not exists clinical_proposals_patient_status_idx on public.clinical_proposals(patient_id, status, created_at desc);
create index if not exists clinical_facts_patient_kind_idx on public.clinical_facts(patient_id, kind, created_at desc);
create index if not exists timeline_events_patient_date_idx on public.timeline_events(patient_id, event_date);
create index if not exists medications_patient_status_idx on public.medications(patient_id, status);
create index if not exists risk_events_patient_status_idx on public.risk_events(patient_id, status, created_at desc);

drop trigger if exists touch_psychologist_patient_links_updated_at on public.psychologist_patient_links;
create trigger touch_psychologist_patient_links_updated_at before update on public.psychologist_patient_links
for each row execute function public.touch_updated_at();

drop trigger if exists touch_clinical_documents_updated_at on public.clinical_documents;
create trigger touch_clinical_documents_updated_at before update on public.clinical_documents
for each row execute function public.touch_updated_at();

drop trigger if exists touch_document_extractions_updated_at on public.document_extractions;
create trigger touch_document_extractions_updated_at before update on public.document_extractions
for each row execute function public.touch_updated_at();

drop trigger if exists touch_clinical_proposals_updated_at on public.clinical_proposals;
create trigger touch_clinical_proposals_updated_at before update on public.clinical_proposals
for each row execute function public.touch_updated_at();

drop trigger if exists touch_clinical_facts_updated_at on public.clinical_facts;
create trigger touch_clinical_facts_updated_at before update on public.clinical_facts
for each row execute function public.touch_updated_at();

drop trigger if exists touch_clinical_profiles_updated_at on public.clinical_profiles;
create trigger touch_clinical_profiles_updated_at before update on public.clinical_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_timeline_events_updated_at on public.timeline_events;
create trigger touch_timeline_events_updated_at before update on public.timeline_events
for each row execute function public.touch_updated_at();

drop trigger if exists touch_medications_updated_at on public.medications;
create trigger touch_medications_updated_at before update on public.medications
for each row execute function public.touch_updated_at();

drop trigger if exists touch_risk_events_updated_at on public.risk_events;
create trigger touch_risk_events_updated_at before update on public.risk_events
for each row execute function public.touch_updated_at();

drop trigger if exists touch_weekly_reviews_updated_at on public.weekly_reviews;
create trigger touch_weekly_reviews_updated_at before update on public.weekly_reviews
for each row execute function public.touch_updated_at();

insert into public.psychologist_patient_links (patient_id, psychologist_id, source)
select p.id, (p.contexto_terapeutico ->> 'assigned_psychologist_id')::uuid, 'profile_context'
from public.profiles p
where p.contexto_terapeutico ? 'assigned_psychologist_id'
  and (p.contexto_terapeutico ->> 'assigned_psychologist_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
on conflict (patient_id, psychologist_id) do update
set status = 'active',
    source = excluded.source,
    updated_at = timezone('utc'::text, now());

insert into public.psychologist_patient_links (patient_id, psychologist_id, source)
select distinct patient_id, psychologist_id, 'appointment'
from public.appointments
where patient_id is not null and psychologist_id is not null
on conflict (patient_id, psychologist_id) do update
set status = 'active',
    source = excluded.source,
    updated_at = timezone('utc'::text, now());

alter table public.psychologist_patient_links enable row level security;
alter table public.clinical_documents enable row level security;
alter table public.document_extractions enable row level security;
alter table public.clinical_proposals enable row level security;
alter table public.clinical_facts enable row level security;
alter table public.clinical_profiles enable row level security;
alter table public.timeline_events enable row level security;
alter table public.medications enable row level security;
alter table public.risk_events enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Clinical links visible to linked users" on public.psychologist_patient_links;
create policy "Clinical links visible to linked users"
on public.psychologist_patient_links for select to authenticated
using (patient_id = auth.uid() or psychologist_id = auth.uid() or public.is_clinical_admin());

drop policy if exists "Clinical links managed by admins" on public.psychologist_patient_links;
create policy "Clinical links managed by admins"
on public.psychologist_patient_links for all to authenticated
using (public.is_clinical_admin())
with check (public.is_clinical_admin());

drop policy if exists "Clinical documents visible to care team" on public.clinical_documents;
create policy "Clinical documents visible to care team"
on public.clinical_documents for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Patients upload own clinical documents" on public.clinical_documents;
create policy "Patients upload own clinical documents"
on public.clinical_documents for insert to authenticated
with check (patient_id = auth.uid() and uploaded_by = auth.uid());

drop policy if exists "Care team updates clinical documents" on public.clinical_documents;
create policy "Care team updates clinical documents"
on public.clinical_documents for update to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Clinical documents deletable by owner or admin" on public.clinical_documents;
create policy "Clinical documents deletable by owner or admin"
on public.clinical_documents for delete to authenticated
using (patient_id = auth.uid() or public.is_clinical_admin());

drop policy if exists "Document extractions visible to care team" on public.document_extractions;
create policy "Document extractions visible to care team"
on public.document_extractions for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Document extractions service writable" on public.document_extractions;
create policy "Document extractions service writable"
on public.document_extractions for all to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Clinical proposals visible to care team" on public.clinical_proposals;
create policy "Clinical proposals visible to care team"
on public.clinical_proposals for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Clinical proposals insertable for own patient" on public.clinical_proposals;
create policy "Clinical proposals insertable for own patient"
on public.clinical_proposals for insert to authenticated
with check (public.can_access_patient(patient_id));

drop policy if exists "Clinical proposals reviewable by care team" on public.clinical_proposals;
create policy "Clinical proposals reviewable by care team"
on public.clinical_proposals for update to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Clinical facts visible to care team" on public.clinical_facts;
create policy "Clinical facts visible to care team"
on public.clinical_facts for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Clinical facts writable by care team" on public.clinical_facts;
create policy "Clinical facts writable by care team"
on public.clinical_facts for all to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Clinical profiles visible to care team" on public.clinical_profiles;
create policy "Clinical profiles visible to care team"
on public.clinical_profiles for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Clinical profiles writable by care team" on public.clinical_profiles;
create policy "Clinical profiles writable by care team"
on public.clinical_profiles for all to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Timeline visible to care team" on public.timeline_events;
create policy "Timeline visible to care team"
on public.timeline_events for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Timeline writable by care team" on public.timeline_events;
create policy "Timeline writable by care team"
on public.timeline_events for all to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Medications visible to care team" on public.medications;
create policy "Medications visible to care team"
on public.medications for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Medications writable by care team" on public.medications;
create policy "Medications writable by care team"
on public.medications for all to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Risk events visible to care team" on public.risk_events;
create policy "Risk events visible to care team"
on public.risk_events for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Risk events writable by care team" on public.risk_events;
create policy "Risk events writable by care team"
on public.risk_events for all to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Weekly reviews visible to care team" on public.weekly_reviews;
create policy "Weekly reviews visible to care team"
on public.weekly_reviews for select to authenticated
using (public.can_access_patient(patient_id));

drop policy if exists "Weekly reviews writable by care team" on public.weekly_reviews;
create policy "Weekly reviews writable by care team"
on public.weekly_reviews for all to authenticated
using (public.can_access_patient(patient_id))
with check (public.can_access_patient(patient_id));

drop policy if exists "Audit logs visible to admins" on public.audit_logs;
create policy "Audit logs visible to admins"
on public.audit_logs for select to authenticated
using (public.is_clinical_admin());

drop policy if exists "Audit logs insertable by care team" on public.audit_logs;
create policy "Audit logs insertable by care team"
on public.audit_logs for insert to authenticated
with check (public.can_access_patient(patient_id) or public.is_clinical_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinical-documents',
  'clinical-documents',
  false,
  52428800,
  array[
    'text/plain',
    'text/markdown',
    'application/json',
    'text/csv',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp',
    'audio/webm',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-wav'
  ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Clinical storage visible to care team" on storage.objects;
create policy "Clinical storage visible to care team"
on storage.objects for select to authenticated
using (
  bucket_id = 'clinical-documents'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.can_access_patient(split_part(name, '/', 1)::uuid)
);

drop policy if exists "Patients upload own clinical storage" on storage.objects;
create policy "Patients upload own clinical storage"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'clinical-documents'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Clinical storage deletable by owner or admin" on storage.objects;
create policy "Clinical storage deletable by owner or admin"
on storage.objects for delete to authenticated
using (
  bucket_id = 'clinical-documents'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (split_part(name, '/', 1)::uuid = auth.uid() or public.is_clinical_admin())
);
