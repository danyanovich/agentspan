# AgentsPan Architecture (Implemented Baseline)

## Layers

1. Runtime Layer (`packages/runtime-adapter-*`)
2. Orchestration Core (`apps/api/src/core.js`)
3. Event Layer (`packages/events`)
4. Projection Layer (`packages/projections`)
5. Operational UI (`apps/web`)
6. Spatial UI (`apps/web` with world map panel + `packages/spatial`)

## Runtime adapter contract

Implemented methods:

- createAgentBinding
- updateAgentBinding
- deleteAgentBinding
- startRun
- stopRun
- pauseRun
- resumeRun
- sendContext
- requestApproval
- getRunStatus
- streamRuntimeEvents
- collectArtifacts
- syncAgentState
- healthCheck

## Event flow

1. API receives intent.
2. Core validates and maps to command/event.
3. Event appended to event store.
4. Event copied to outbox.
5. Projection engine updates operational and spatial views.
6. SSE pushes events to all clients.

## API surface (v1 baseline)

Implemented:

- `POST /tenants`
- `POST /worlds`
- `POST /agents`
- `GET /agents`
- `POST /goals`
- `GET /goals`
- `POST /tasks`
- `GET /tasks`
- `POST /tasks/:id/assign`
- `POST /runs/start`
- `POST /artifacts`
- `GET /events/stream`
- `GET /worlds/:id/projection/operational`
- `GET /worlds/:id/projection/spatial`

Planned next in same shape:

- task cancel/review
- run retry/stop
- runtime connect endpoints
- policy/approval gates
- audit expansion
