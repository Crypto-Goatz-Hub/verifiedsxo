-- Agency domain verification + public claims wall support
-- Applied to DB directly on 2026-04-20; file kept for version history.

alter table public.vsxo_agencies
  add column if not exists website                 text,
  add column if not exists domain_verified         boolean not null default false,
  add column if not exists domain_verified_at      timestamptz,
  add column if not exists domain_verified_email   text;

create index if not exists vsxo_agencies_domain_verified_idx
  on public.vsxo_agencies(domain_verified) where domain_verified = true;
