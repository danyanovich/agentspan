export function createProjectionState() {
  return {
    operational: {
      tenant: null,
      world: null,
      scenePack: null,
      agents: {},
      goals: {},
      tasks: {},
      runs: {},
      handoffs: {},
      artifacts: {},
      alerts: [],
      events: []
    },
    spatial: {
      world: null,
      scenePack: null,
      zones: {},
      stations: {},
      links: {},
      agents: {},
      artifacts: {},
      overlays: {
        queue: {},
        alerts: []
      }
    },
    analytics: {
      counters: {
        events: 0,
        tasksOpen: 0,
        tasksDone: 0,
        runsActive: 0,
        artifactsTotal: 0
      }
    }
  };
}

export function applyEvent(state, event) {
  state.operational.events.unshift(event);
  state.analytics.counters.events += 1;

  switch (event.eventType) {
    case 'tenant_created':
      state.operational.tenant = event.payload;
      break;
    case 'world_created':
      state.operational.world = event.payload;
      state.spatial.world = event.payload;
      break;
    case 'scene_pack_attached':
      state.operational.scenePack = event.payload.scenePack;
      state.spatial.scenePack = event.payload.scenePack;
      break;
    case 'zone_created':
      state.spatial.zones[event.aggregateId] = event.payload;
      break;
    case 'station_created':
      state.spatial.stations[event.aggregateId] = event.payload;
      break;
    case 'link_created':
      state.spatial.links[event.aggregateId] = event.payload;
      break;
    case 'agent_created':
      state.operational.agents[event.aggregateId] = event.payload;
      state.spatial.agents[event.aggregateId] = event.payload;
      break;
    case 'agent_state_changed':
      if (state.operational.agents[event.aggregateId]) {
        state.operational.agents[event.aggregateId] = {
          ...state.operational.agents[event.aggregateId],
          ...event.payload
        };
        state.spatial.agents[event.aggregateId] = {
          ...state.spatial.agents[event.aggregateId],
          ...event.payload
        };
      }
      break;
    case 'goal_created':
      state.operational.goals[event.aggregateId] = event.payload;
      break;
    case 'task_created':
      state.operational.tasks[event.aggregateId] = event.payload;
      state.analytics.counters.tasksOpen += 1;
      break;
    case 'task_assigned':
      if (state.operational.tasks[event.aggregateId]) {
        state.operational.tasks[event.aggregateId].assignedTo = event.payload.assignedTo;
      }
      break;
    case 'task_split':
      if (state.operational.tasks[event.aggregateId]) {
        state.operational.tasks[event.aggregateId] = {
          ...state.operational.tasks[event.aggregateId],
          ...event.payload
        };
      }
      break;
    case 'run_started':
      state.operational.runs[event.aggregateId] = event.payload;
      state.analytics.counters.runsActive += 1;
      break;
    case 'run_status_synced':
      if (state.operational.runs[event.aggregateId]) {
        state.operational.runs[event.aggregateId] = {
          ...state.operational.runs[event.aggregateId],
          ...event.payload
        };
      }
      break;
    case 'handoff_completed':
      state.operational.handoffs[event.aggregateId] = event.payload;
      break;
    case 'artifact_created':
      state.operational.artifacts[event.aggregateId] = event.payload;
      state.spatial.artifacts[event.aggregateId] = event.payload;
      state.analytics.counters.artifactsTotal += 1;
      break;
    case 'artifact_review_requested':
    case 'artifact_review_failed':
    case 'artifact_approved': {
      const artifactId = event.payload.artifactId ?? event.aggregateId;
      if (state.operational.artifacts[artifactId]) {
        state.operational.artifacts[artifactId].reviewState = event.payload.reviewState ?? event.eventType.replace('artifact_', '');
      }
      break;
    }
    case 'queue_overloaded':
    case 'zone_alerted':
    case 'station_degraded':
    case 'agent_stressed':
      state.operational.alerts.unshift(event);
      state.spatial.overlays.alerts.unshift(event);
      break;
    default:
      break;
  }

  state.operational.events = state.operational.events.slice(0, 300);
  state.operational.alerts = state.operational.alerts.slice(0, 100);
  state.spatial.overlays.alerts = state.spatial.overlays.alerts.slice(0, 100);
  return state;
}

export class ProjectionEngine {
  constructor() {
    this.state = createProjectionState();
  }

  consume(event) {
    applyEvent(this.state, event);
  }

  rebuild(events) {
    this.state = createProjectionState();
    for (const event of events) this.consume(event);
  }

  snapshot() {
    return structuredClone(this.state);
  }
}
