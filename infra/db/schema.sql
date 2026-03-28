create table if not exists events (
  id text primary key,
  world_id text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  event_type text not null,
  payload jsonb not null,
  trace_id text,
  caused_by text,
  created_at timestamptz not null default now()
);

create table if not exists projections (
  id text primary key,
  world_id text not null,
  type text not null,
  version bigint not null,
  content jsonb not null,
  generated_at timestamptz not null default now()
);

create index if not exists idx_events_world_created on events(world_id, created_at);
create index if not exists idx_events_aggregate on events(aggregate_type, aggregate_id);
