-- Predict2U v271 — private Auto Picks v2 extension.
-- Run after auto-picks-learning-v270.sql. No public browser policy is added.
alter table public.auto_pick_snapshots
  add column if not exists config_version text,
  add column if not exists route_id text,
  add column if not exists data_quality numeric,
  add column if not exists candidate_margin numeric,
  add column if not exists profit_units numeric,
  add column if not exists settlement_source text;
create index if not exists auto_pick_snapshots_model_market_idx on public.auto_pick_snapshots(model_version, settle_market);
create index if not exists auto_pick_snapshots_route_idx on public.auto_pick_snapshots(route_id);
alter table public.auto_pick_snapshots enable row level security;
-- Service-role workflows bypass RLS. Deliberately create no browser policy.
