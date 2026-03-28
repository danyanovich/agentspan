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
import { generateWorldLayout } from '../../../packages/spatial/src/index.js';

export class AgentsPanCore {
  constructor() {
    this.store = new InMemoryEventStore();
    this.outbox = new Outbox();
    this.projections = new ProjectionEngine();
    this.runtime = new OpenClawAdapter();

    this.store.subscribe((event) => {
      this.outbox.push(event);
      this.projections.consume(event);
    });

    this.tenants = {};
    this.worlds = {};
  }

  emit(event) {
    this.store.append(event);
    return event;
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

  createAgent(input) {
    const agent = createAgent(input);
    this.emit(domainEvent({ worldId: agent.worldId, aggregateType: 'agent', aggregateId: agent.id, eventType: 'agent_created', payload: agent }));
    return agent;
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

  startRun({ worldId, taskId, agentId, input }) {
    const runtime = this.runtime.startRun({ taskId, agentId, input });
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
}

export const core = new AgentsPanCore();
