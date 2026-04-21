-- Rewards + referral growth loop — applied 2026-04-20

alter table public.vsxo_agencies
  add column if not exists referral_code            text,
  add column if not exists referred_by_agency_id    uuid references public.vsxo_agencies(id) on delete set null,
  add column if not exists referred_at              timestamptz;

update public.vsxo_agencies
set referral_code = slug
where referral_code is null;

alter table public.vsxo_agencies
  drop constraint if exists vsxo_agencies_referral_code_key,
  add constraint vsxo_agencies_referral_code_key unique (referral_code);

create table if not exists public.vsxo_referral_clicks (
  id               uuid primary key default uuid_generate_v4(),
  referral_code    text not null,
  referrer_agency  uuid references public.vsxo_agencies(id) on delete set null,
  landed_path      text,
  user_agent_hash  text,
  ip_hash          text,
  created_at       timestamptz not null default now()
);
create index if not exists vsxo_referral_clicks_code_idx on public.vsxo_referral_clicks(referral_code);
create index if not exists vsxo_referral_clicks_created_idx on public.vsxo_referral_clicks(created_at desc);

create table if not exists public.vsxo_rewards (
  id               uuid primary key default uuid_generate_v4(),
  agency_id        uuid not null references public.vsxo_agencies(id) on delete cascade,
  source_agency_id uuid references public.vsxo_agencies(id) on delete set null,
  kind             text not null check (kind in (
    'free_month_membership', 'unlimited_claims_day', 'deep_research_credit',
    'badge_early_operator', 'badge_streak', 'badge_top10', 'manual'
  )),
  value            numeric default 0,
  note             text,
  source_claim_id  uuid references public.vsxo_claims(id) on delete set null,
  earned_at        timestamptz not null default now(),
  consumed_at      timestamptz
);
create index if not exists vsxo_rewards_agency_idx on public.vsxo_rewards(agency_id, earned_at desc);

alter table public.vsxo_rewards enable row level security;
drop policy if exists vsxo_rewards_self on public.vsxo_rewards;
create policy vsxo_rewards_self on public.vsxo_rewards for select using (
  exists (select 1 from public.vsxo_agencies a where a.id = vsxo_rewards.agency_id and a.owner_user_id = auth.uid())
);

alter table public.vsxo_referral_clicks enable row level security;
