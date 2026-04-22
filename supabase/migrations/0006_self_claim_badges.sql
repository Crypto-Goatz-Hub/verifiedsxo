-- Self-claim badges have no verification_id and no last_verified_at.
-- The original vsxo_badges schema (from 0001_init.sql) marked both NOT NULL
-- which broke /api/agency/claims' auto-badge path for self-claims.
-- Applied 2026-04-22.

alter table public.vsxo_badges alter column verification_id  drop not null;
alter table public.vsxo_badges alter column last_verified_at drop not null;
