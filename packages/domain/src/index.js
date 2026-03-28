export const EntityTypes = Object.freeze({
  Tenant: 'tenant',
  World: 'world',
  Zone: 'zone',
  Station: 'station',
  Link: 'link',
  Agent: 'agent',
  Capability: 'capability',
  Goal: 'goal',
  Task: 'task',
  Run: 'run',
  Handoff: 'handoff',
  Artifact: 'artifact',
  Resource: 'resource',
  Event: 'event',
  Projection: 'projection',
  RiskState: 'risk_state',
  MaintenanceCycle: 'maintenance_cycle',
  LedgerEntry: 'ledger_entry',
  ScenePack: 'scene_pack'
});

export const EventTypes = Object.freeze([
  'tenant_created',
  'world_created',
  'scene_pack_attached',
  'zone_created',
  'station_created',
  'link_created',
  'agent_created',
  'agent_state_changed',
  'runtime_bound',
  'goal_created',
  'task_created',
  'task_split',
  'task_assigned',
  'run_started',
  'run_status_synced',
  'run_output_emitted',
  'artifact_created',
  'artifact_review_requested',
  'artifact_review_failed',
  'artifact_approved',
  'handoff_requested',
  'handoff_completed',
  'resource_reserved',
  'resource_consumed',
  'resource_produced',
  'queue_overloaded',
  'station_degraded',
  'zone_alerted',
  'agent_stressed',
  'agent_recovered',
  'economy_recalculated',
  'projection_refreshed'
]);

export function makeId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function domainEvent({ worldId, aggregateType, aggregateId, eventType, payload = {}, traceId = null, causedBy = 'system' }) {
  if (!EventTypes.includes(eventType)) throw new Error(`Unknown event type: ${eventType}`);
  return {
    id: makeId('evt'),
    worldId,
    aggregateType,
    aggregateId,
    eventType,
    payload,
    traceId,
    causedBy,
    createdAt: nowIso()
  };
}

export function createTenant({ ownerId, name, mode = 'single-tenant', securityProfile = 'trusted-operator' }) {
  return {
    id: makeId('tenant'),
    ownerId,
    name,
    mode,
    securityProfile,
    limits: {},
    runtimeBindings: []
  };
}

export function createWorld({ tenantId, name, theme = 'minimal-light', scenePackId = 'default-grid' }) {
  return {
    id: makeId('world'),
    tenantId,
    name,
    theme,
    status: 'active',
    settings: {},
    scenePackId
  };
}

export function createAgent({ tenantId, worldId, name, runtimeType = 'openclaw', runtimeBindingId = 'default-binding' }) {
  return {
    id: makeId('agent'),
    tenantId,
    worldId,
    name,
    profile: {},
    runtimeType,
    runtimeBindingId,
    status: 'idle',
    energy: 100,
    stress: 0,
    skill: 1,
    mood: 'stable',
    traits: [],
    capabilities: [],
    permissions: [],
    currentZoneId: null,
    currentStationId: null
  };
}

export function createGoal({ worldId, title, description = '', priority = 'normal', ownerId = null }) {
  return {
    id: makeId('goal'),
    worldId,
    title,
    description,
    priority,
    status: 'open',
    constraints: {},
    ownerId
  };
}

export function createTask({ worldId, goalId = null, title, description = '', priority = 'normal', assignedTo = null }) {
  return {
    id: makeId('task'),
    worldId,
    goalId,
    title,
    description,
    status: 'open',
    priority,
    source: 'manual',
    assignedTo,
    parentTaskId: null,
    constraints: {},
    deadline: null,
    traceId: makeId('trace')
  };
}
