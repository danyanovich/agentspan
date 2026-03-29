import { InMemoryEventStore, Outbox } from '../../../packages/events/src/index.js';
import { ProjectionEngine } from '../../../packages/projections/src/index.js';
import {
  createTenant,
  createWorld,
  createAgent,
  createGoal,
  createTask,
  domainEvent,
  makeId
} from '../../../packages/domain/src/index.js';
import { OpenClawAdapter } from '../../../packages/runtime-adapter-openclaw/src/index.js';
import { CustomRuntimeAdapter } from '../../../packages/runtime-adapter-custom/src/index.js';
import { generateWorldLayout } from '../../../packages/spatial/src/index.js';

export class AgentsPanCore {
  constructor() {
    this.store = new InMemoryEventStore();
    this.outbox = new Outbox();
    this.projections = new ProjectionEngine();

    this.runtimes = {
      openclaw: new OpenClawAdapter(),
      custom: new CustomRuntimeAdapter()
    };

    this.tenants = {};
    this.worlds = {};
    this.scenePacks = {
      'default-grid': {
        id: 'default-grid',
        name: 'Default Grid',
        version: '1.0.0',
        theme: 'minimal-light',
        rendererType: 'canvas-2d',
        zoneMappings: {},
        stationMappings: {},
        visualRules: { gridCell: 32 }
      }
    };

    this.store.subscribe((event) => {
      this.outbox.push(event);
      this.projections.consume(event);
    });
  }

  emit(event) {
    this.store.append(event);
    return event;
  }

  snapshot() {
    return this.projections.snapshot();
  }

  createTenant(input) {
    const tenant = createTenant(input);
    this.tenants[tenant.id] = tenant;
    return this.emit(domainEvent({
      worldId: 'global',
      aggregateType: 'tenant',
      aggregateId: tenant.id,
      eventType: 'tenant_created',
      payload: tenant,
      causedBy: input.ownerId ?? 'api'
    }));
  }

  createWorld(input) {
    const world = createWorld(input);
    this.worlds[world.id] = world;
    this.emit(domainEvent({ worldId: world.id, aggregateType: 'world', aggregateId: world.id, eventType: 'world_created', payload: world }));

    const scenePack = this.scenePacks[world.scenePackId] ?? this.scenePacks['default-grid'];
    this.emit(domainEvent({
      worldId: world.id,
      aggregateType: 'scene_pack',
      aggregateId: scenePack.id,
      eventType: 'scene_pack_attached',
      payload: { worldId: world.id, scenePack }
    }));

    const layout = generateWorldLayout({ zoneCount: 5, stationCount: 24 });
    for (const zone of layout.zones) {
      this.emit(domainEvent({ worldId: world.id, aggregateType: 'zone', aggregateId: zone.id, eventType: 'zone_created', payload: { ...zone, worldId: world.id } }));
    }
    for (const station of layout.stations) {
      this.emit(domainEvent({ worldId: world.id, aggregateType: 'station', aggregateId: station.id, eventType: 'station_created', payload: { ...station, worldId: world.id } }));
    }
    for (const link of layout.links) {
      this.emit(domainEvent({ worldId: world.id, aggregateType: 'link', aggregateId: link.id, eventType: 'link_created', payload: { ...link, worldId: world.id } }));
    }

    return world;
  }

  attachScenePack({ worldId, scenePackId = 'default-grid' }) {
    const scenePack = this.scenePacks[scenePackId] ?? this.scenePacks['default-grid'];
    this.emit(domainEvent({
      worldId,
      aggregateType: 'scene_pack',
      aggregateId: scenePack.id,
      eventType: 'scene_pack_attached',
      payload: { worldId, scenePack }
    }));
    return scenePack;
  }

  createAgent(input) {
    const agent = createAgent(input);
    this.emit(domainEvent({ worldId: agent.worldId, aggregateType: 'agent', aggregateId: agent.id, eventType: 'agent_created', payload: agent }));
    return agent;
  }

  updateAgent({ agentId, worldId, patch }) {
    this.emit(domainEvent({
      worldId,
      aggregateType: 'agent',
      aggregateId: agentId,
      eventType: 'agent_state_changed',
      payload: patch
    }));
    return { id: agentId, ...patch };
  }

  createGoal(input) {
    const goal = createGoal(input);
    this.emit(domainEvent({ worldId: goal.worldId, aggregateType: 'goal', aggregateId: goal.id, eventType: 'goal_created', payload: goal }));
    return goal;
  }

  createTask(input) {
    const task = createTask(input);
    this.emit(domainEvent({ worldId: task.worldId, aggregateType: 'task', aggregateId: task.id, eventType: 'task_created', payload: task }));
    return task;
  }

  assignTask({ worldId, taskId, assignedTo }) {
    this.emit(domainEvent({
      worldId,
      aggregateType: 'task',
      aggregateId: taskId,
      eventType: 'task_assigned',
      payload: { assignedTo }
    }));
    return { taskId, assignedTo };
  }

  cancelTask({ worldId, taskId, reason = 'cancelled_by_user' }) {
    this.emit(domainEvent({
      worldId,
      aggregateType: 'task',
      aggregateId: taskId,
      eventType: 'task_split',
      payload: { status: 'cancelled', reason }
    }));
    return { taskId, status: 'cancelled', reason };
  }

  reviewTask({ worldId, taskId, reviewState = 'in_review', comment = '' }) {
    this.emit(domainEvent({
      worldId,
      aggregateType: 'artifact',
      aggregateId: taskId,
      eventType: reviewState === 'approved' ? 'artifact_approved' : 'artifact_review_requested',
      payload: { taskId, reviewState, comment }
    }));
    return { taskId, reviewState, comment };
  }

  startRun({ worldId, taskId, agentId, input }) {
    const runtime = this.runtimes.openclaw.startRun({ taskId, agentId, input });
    const run = {
      id: makeId('run'),
      taskId,
      agentId,
      runtimeType: 'openclaw',
      runtimeRunId: runtime.runtimeRunId,
      status: 'running',
      input,
      output: null,
      startedAt: new Date().toISOString(),
      endedAt: null,
      cost: 0,
      tokenUsage: 0,
      failureReason: null,
      traceId: makeId('trace')
    };
    this.emit(domainEvent({ worldId, aggregateType: 'run', aggregateId: run.id, eventType: 'run_started', payload: run }));
    return run;
  }

  syncRunStatus({ worldId, runId, status, output = null, failureReason = null }) {
    this.emit(domainEvent({
      worldId,
      aggregateType: 'run',
      aggregateId: runId,
      eventType: 'run_status_synced',
      payload: {
        status,
        output,
        failureReason,
        endedAt: ['completed', 'failed', 'stopped', 'cancelled'].includes(status) ? new Date().toISOString() : null
      }
    }));
    return { runId, status, output, failureReason };
  }

  retryRun({ worldId, runId }) {
    const run = this.snapshot().operational.runs[runId];
    if (!run) throw new Error(`Run not found: ${runId}`);
    return this.startRun({ worldId, taskId: run.taskId, agentId: run.agentId, input: run.input });
  }

  stopRun({ worldId, runId }) {
    return this.syncRunStatus({ worldId, runId, status: 'stopped' });
  }

  createHandoff({ worldId, fromAgentId, toAgentId, taskId, artifactIds = [], reason = 'handoff' }) {
    const handoff = {
      id: makeId('handoff'),
      fromAgentId,
      toAgentId,
      taskId,
      artifactIds,
      reason,
      status: 'completed'
    };
    this.emit(domainEvent({
      worldId,
      aggregateType: 'handoff',
      aggregateId: handoff.id,
      eventType: 'handoff_completed',
      payload: handoff
    }));
    return handoff;
  }

  createArtifact({ worldId, producerRunId, producerAgentId, type = 'document', title, contentRef }) {
    const artifact = {
      id: makeId('artifact'),
      worldId,
      type,
      title,
      contentRef,
      producerRunId,
      producerAgentId,
      qualityScore: null,
      reviewState: 'draft',
      version: 1
    };
    this.emit(domainEvent({ worldId, aggregateType: 'artifact', aggregateId: artifact.id, eventType: 'artifact_created', payload: artifact }));
    return artifact;
  }

  connectRuntime({ worldId, runtimeType = 'openclaw', bindingName = 'default' }) {
    const adapter = this.runtimes[runtimeType];
    if (!adapter) throw new Error(`Unknown runtime: ${runtimeType}`);
    const binding = adapter.createAgentBinding({ worldId, bindingName });
    this.emit(domainEvent({
      worldId,
      aggregateType: 'runtime_binding',
      aggregateId: binding.bindingId,
      eventType: 'runtime_bound',
      payload: { runtimeType, ...binding }
    }));
    return binding;
  }
}

export const core = new AgentsPanCore();
