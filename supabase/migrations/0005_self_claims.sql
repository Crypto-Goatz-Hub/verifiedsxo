-- Self-claims — agencies can submit claims without a client attestation.
-- Scored normally, badge issues as "Unverified / self-attested", never reaches verified/elevated.
-- Applied 2026-04-20.

alter table public.vsxo_claims
  alter column client_id drop not null,
  add column if not exists self_claim boolean not null default false;

alter table public.vsxo_badges
  alter column client_id drop not null,
  add column if not exists self_claim boolean not null default false;
