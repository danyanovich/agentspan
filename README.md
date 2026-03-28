# AgentsPan

AgentsPan is a world-oriented orchestration system for AI agents with two equal modes built on one domain/event core:

- **Operational Mode**: fast execution UI for goals, tasks, runs, artifacts, alerts.
- **Spatial Mode**: lightweight 2D world projection (zones, stations, links, agent presence, queue/risk overlays).

## Core principles

1. **Single source of truth**: domain aggregates + append-only events + projections.
2. **Zero UI-owned domain state**: both UIs render projections from the same core.
3. **Runtime-agnostic orchestration**: runtime adapters implement a contract; OpenClaw is the primary adapter, not the core.
4. **One-command bootstrap**:
   - `npx agentspan@latest`
   - `npx agentspan@latest init|dev|doctor|connect-openclaw|connect-runtime|seed|upgrade`

## Monorepo structure

- `apps/api` Fastify-like HTTP API (implemented with built-in Node HTTP in this bootstrap).
- `apps/web` operational + spatial UI shell.
- `apps/worker` projection/event worker.
- `apps/cli` one-command bootstrap and operational commands.
- `packages/domain` domain entities, value objects, commands, events.
- `packages/events` event store, outbox, replay primitives.
- `packages/projections` operational/spatial/alerts/analytics projections.
- `packages/runtime-adapter-*` runtime contracts + OpenClaw/custom adapters.
- `packages/ui` shared UI model + tokens.
- `packages/spatial` world renderer model + procedural generation.

## Current implementation scope

This repository contains a complete **reference architecture implementation** with:

- full domain/event vocabulary,
- runtime adapter contract,
- in-memory event store with replay,
- projection engine,
- API endpoints aligned to the requested contract,
- operational + spatial frontend skeleton,
- CLI bootstrap commands,
- docker/dev environment templates.

It is intentionally lightweight and designed to be extended to production infra (Postgres/Redis/S3, authz, policy gates, tenant isolation hardening, observability backends).
