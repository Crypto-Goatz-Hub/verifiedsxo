-- Verify engine: research bundle + citations table.
-- Applied to DB directly on 2026-04-20; file kept for version history.

alter table public.vsxo_claims
  add column if not exists research               jsonb,
  add column if not exists research_verdict       text,
  add column if not exists research_confidence    int,
  add column if not exists research_tier          text,
  add column if not exists research_ran_at        timestamptz;

create table if not exists public.vsxo_claim_citations (
  id              uuid primary key default uuid_generate_v4(),
  claim_id        uuid not null references public.vsxo_claims(id) on delete cascade,
  url             text not null,
  title           text,
  snippet         text,
  source          text,
  relevance       int default 0,
  stance          text default 'unrelated' check (stance in ('supports','contradicts','unrelated','mixed')),
  fetched_ok      boolean default true,
  created_at      timestamptz not null default now()
);

create index if not exists vsxo_claim_citations_claim_idx
  on public.vsxo_claim_citations(claim_id);

alter table public.vsxo_claim_citations enable row level security;
drop policy if exists vsxo_claim_citations_select on public.vsxo_claim_citations;
create policy vsxo_claim_citations_select
  on public.vsxo_claim_citations for select using (true);
