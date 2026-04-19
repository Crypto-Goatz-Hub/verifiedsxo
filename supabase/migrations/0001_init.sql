-- =====================================================================
-- VerifiedSXO — Initial schema
-- All tables prefixed `vsxo_` (shared Supabase project: pwujhhmlrtxjmjzyttwn)
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================================
-- Agencies — top-level tenants signed up via /signup
-- =====================================================================
create table if not exists public.vsxo_agencies (
  id              uuid primary key default uuid_generate_v4(),
  owner_user_id   uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  slug            text not null unique,
  logo_url        text,
  website         text,
  crm_contact_id  text,
  plan            text not null default 'free' check (plan in ('free','starter','pro','scale')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists vsxo_agencies_owner_idx on public.vsxo_agencies(owner_user_id);

-- =====================================================================
-- Agency members — users who can administer an agency
-- =====================================================================
create table if not exists public.vsxo_agency_members (
  id          uuid primary key default uuid_generate_v4(),
  agency_id   uuid not null references public.vsxo_agencies(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner','admin','member','viewer')),
  added_at    timestamptz not null default now(),
  unique (agency_id, user_id)
);

create index if not exists vsxo_agency_members_user_idx on public.vsxo_agency_members(user_id);

-- =====================================================================
-- Agency clients — marketers invited by the agency to verify their claims
-- Each client is a CRM contact (tagged Client + agency_id) and optionally a Supabase auth user (if they log in)
-- =====================================================================
create table if not exists public.vsxo_agency_clients (
  id              uuid primary key default uuid_generate_v4(),
  agency_id       uuid not null references public.vsxo_agencies(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  crm_contact_id  text,
  name            text not null,
  email           text not null,
  company         text,
  website         text,
  status          text not null default 'invited' check (status in ('invited','active','churned','suspended')),
  invite_token    text unique,
  invite_sent_at  timestamptz,
  invite_accepted_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (agency_id, email)
);

create index if not exists vsxo_agency_clients_agency_idx on public.vsxo_agency_clients(agency_id);
create index if not exists vsxo_agency_clients_user_idx on public.vsxo_agency_clients(user_id);
create index if not exists vsxo_agency_clients_status_idx on public.vsxo_agency_clients(status);

-- =====================================================================
-- Claims — each stat claim submitted for verification
-- =====================================================================
create table if not exists public.vsxo_claims (
  id                  uuid primary key default uuid_generate_v4(),
  client_id           uuid not null references public.vsxo_agency_clients(id) on delete cascade,
  agency_id           uuid not null references public.vsxo_agencies(id) on delete cascade,
  submitted_by_user   uuid references auth.users(id) on delete set null,
  claim_text          text not null,
  claim_type          text not null default 'general',
  plausibility_score  int check (plausibility_score between 0 and 100),
  plausibility_reasoning jsonb,
  plausibility_tier   text check (plausibility_tier in ('agent','groq','fallback')),
  status              text not null default 'scored' check (status in ('scored','connecting','verifying','verified','rejected','expired')),
  target_metric       jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists vsxo_claims_client_idx on public.vsxo_claims(client_id);
create index if not exists vsxo_claims_agency_idx on public.vsxo_claims(agency_id);
create index if not exists vsxo_claims_status_idx on public.vsxo_claims(status);
create index if not exists vsxo_claims_created_idx on public.vsxo_claims(created_at desc);

-- =====================================================================
-- Data connections — per-client OAuth tokens to GSC / GA4 / Stripe / etc.
-- Tokens encrypted at rest via pgcrypto; actual encryption handled by app layer.
-- =====================================================================
create table if not exists public.vsxo_data_connections (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references public.vsxo_agency_clients(id) on delete cascade,
  provider        text not null check (provider in ('gsc','ga4','google_ads','stripe','github','linkedin')),
  account_label   text,
  access_token_enc  text,
  refresh_token_enc text,
  expires_at      timestamptz,
  scope           text,
  status          text not null default 'connected' check (status in ('connected','expired','revoked','error')),
  connected_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (client_id, provider, account_label)
);

create index if not exists vsxo_data_connections_client_idx on public.vsxo_data_connections(client_id);
create index if not exists vsxo_data_connections_provider_idx on public.vsxo_data_connections(provider);

-- =====================================================================
-- Verifications — each attempt to verify a claim against real data
-- =====================================================================
create table if not exists public.vsxo_verifications (
  id              uuid primary key default uuid_generate_v4(),
  claim_id        uuid not null references public.vsxo_claims(id) on delete cascade,
  provider        text not null,
  evidence        jsonb not null,
  passed          boolean not null,
  confidence      int check (confidence between 0 and 100),
  verified_at     timestamptz not null default now(),
  expires_at      timestamptz
);

create index if not exists vsxo_verifications_claim_idx on public.vsxo_verifications(claim_id);
create index if not exists vsxo_verifications_passed_idx on public.vsxo_verifications(passed);

-- =====================================================================
-- Badges — public verification pages + embed scripts
-- =====================================================================
create table if not exists public.vsxo_badges (
  id                uuid primary key default uuid_generate_v4(),
  verification_id   uuid not null unique references public.vsxo_verifications(id) on delete cascade,
  claim_id          uuid not null references public.vsxo_claims(id) on delete cascade,
  client_id         uuid not null references public.vsxo_agency_clients(id) on delete cascade,
  slug              text not null unique,
  script_token      text not null unique,
  public_visible    boolean not null default true,
  embed_count       int not null default 0,
  last_verified_at  timestamptz not null default now(),
  case_study_md     text,
  testimonial       jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists vsxo_badges_client_idx on public.vsxo_badges(client_id);
create index if not exists vsxo_badges_slug_idx on public.vsxo_badges(slug);

-- =====================================================================
-- Updated-at triggers
-- =====================================================================
create or replace function public.vsxo_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vsxo_agencies_touch on public.vsxo_agencies;
create trigger vsxo_agencies_touch before update on public.vsxo_agencies
  for each row execute function public.vsxo_touch_updated_at();

drop trigger if exists vsxo_agency_clients_touch on public.vsxo_agency_clients;
create trigger vsxo_agency_clients_touch before update on public.vsxo_agency_clients
  for each row execute function public.vsxo_touch_updated_at();

drop trigger if exists vsxo_claims_touch on public.vsxo_claims;
create trigger vsxo_claims_touch before update on public.vsxo_claims
  for each row execute function public.vsxo_touch_updated_at();

drop trigger if exists vsxo_data_connections_touch on public.vsxo_data_connections;
create trigger vsxo_data_connections_touch before update on public.vsxo_data_connections
  for each row execute function public.vsxo_touch_updated_at();

-- =====================================================================
-- Row Level Security
-- Policy model:
--   - Service role bypasses all RLS (for server-side API routes)
--   - Authenticated users see: their own agencies, their agencies' clients/claims
--   - Anonymous users see: nothing (except public pages via published badge slug,
--     which the app serves through service-role queries)
-- =====================================================================
alter table public.vsxo_agencies           enable row level security;
alter table public.vsxo_agency_members     enable row level security;
alter table public.vsxo_agency_clients     enable row level security;
alter table public.vsxo_claims             enable row level security;
alter table public.vsxo_data_connections   enable row level security;
alter table public.vsxo_verifications      enable row level security;
alter table public.vsxo_badges             enable row level security;

-- Helper: returns true if current user is a member of the given agency
create or replace function public.vsxo_is_member(_agency_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.vsxo_agency_members m
    where m.agency_id = _agency_id and m.user_id = auth.uid()
  );
$$;

-- Agencies — owner or member can read, owner can update, anyone authenticated can insert
drop policy if exists vsxo_agencies_select on public.vsxo_agencies;
create policy vsxo_agencies_select on public.vsxo_agencies for select
  using (owner_user_id = auth.uid() or public.vsxo_is_member(id));

drop policy if exists vsxo_agencies_insert on public.vsxo_agencies;
create policy vsxo_agencies_insert on public.vsxo_agencies for insert
  with check (owner_user_id = auth.uid());

drop policy if exists vsxo_agencies_update on public.vsxo_agencies;
create policy vsxo_agencies_update on public.vsxo_agencies for update
  using (owner_user_id = auth.uid());

-- Agency members — user can see rows for agencies they belong to
drop policy if exists vsxo_members_select on public.vsxo_agency_members;
create policy vsxo_members_select on public.vsxo_agency_members for select
  using (user_id = auth.uid() or public.vsxo_is_member(agency_id));

-- Agency clients — members of the agency can read; clients can read their own row
drop policy if exists vsxo_clients_select on public.vsxo_agency_clients;
create policy vsxo_clients_select on public.vsxo_agency_clients for select
  using (public.vsxo_is_member(agency_id) or user_id = auth.uid());

-- Claims — members of the agency can read; the client can read their own claims
drop policy if exists vsxo_claims_select on public.vsxo_claims;
create policy vsxo_claims_select on public.vsxo_claims for select
  using (
    public.vsxo_is_member(agency_id)
    or client_id in (select id from public.vsxo_agency_clients where user_id = auth.uid())
  );

-- Data connections — only the connected client or agency members can read
drop policy if exists vsxo_data_connections_select on public.vsxo_data_connections;
create policy vsxo_data_connections_select on public.vsxo_data_connections for select
  using (
    client_id in (select id from public.vsxo_agency_clients where user_id = auth.uid())
    or client_id in (select id from public.vsxo_agency_clients where agency_id in
      (select agency_id from public.vsxo_agency_members where user_id = auth.uid()))
  );

-- Verifications — same as claims
drop policy if exists vsxo_verifications_select on public.vsxo_verifications;
create policy vsxo_verifications_select on public.vsxo_verifications for select
  using (claim_id in (select id from public.vsxo_claims));

-- Badges — readable to everyone IF public_visible (public pages), else members only
drop policy if exists vsxo_badges_select on public.vsxo_badges;
create policy vsxo_badges_select on public.vsxo_badges for select
  using (
    public_visible = true
    or client_id in (select id from public.vsxo_agency_clients where user_id = auth.uid())
    or client_id in (select id from public.vsxo_agency_clients where agency_id in
      (select agency_id from public.vsxo_agency_members where user_id = auth.uid()))
  );

-- =====================================================================
-- Done
-- =====================================================================
