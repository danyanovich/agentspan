import http from 'node:http';
import { URL } from 'node:url';
import { core } from './core.js';
import { loadConfig } from '../../../packages/config/src/index.js';
import { logger } from '../../../packages/observability/src/index.js';

const config = loadConfig();
const sseClients = new Set();
core.store.subscribe((event) => {
  const data = `event: domain\ndata: ${JSON.stringify(event)}\n\n`;
  for (const res of sseClients) res.write(data);
});

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8') || '{}';
  return JSON.parse(raw);
}

function snapshot() {
  return core.snapshot();
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { status: 'ok' });

    if (req.method === 'GET' && url.pathname === '/events/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      });
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/tenants') return json(res, 201, core.createTenant(await readJson(req)).payload);
    if (req.method === 'POST' && url.pathname === '/worlds') return json(res, 201, core.createWorld(await readJson(req)));
    if (req.method === 'POST' && url.pathname === '/scene-packs/attach') return json(res, 200, core.attachScenePack(await readJson(req)));

    if (req.method === 'POST' && url.pathname === '/agents') return json(res, 201, core.createAgent(await readJson(req)));
    if (req.method === 'GET' && url.pathname === '/agents') return json(res, 200, Object.values(snapshot().operational.agents));

    const getAgentMatch = url.pathname.match(/^\/agents\/([^/]+)$/);
    if (req.method === 'GET' && getAgentMatch) {
      const agent = snapshot().operational.agents[getAgentMatch[1]];
      return agent ? json(res, 200, agent) : json(res, 404, { error: 'agent_not_found' });
    }
    if (req.method === 'PATCH' && getAgentMatch) {
      const body = await readJson(req);
      return json(res, 200, core.updateAgent({ agentId: getAgentMatch[1], worldId: body.worldId, patch: body.patch ?? body }));
    }

    if (req.method === 'POST' && url.pathname === '/goals') return json(res, 201, core.createGoal(await readJson(req)));
    if (req.method === 'GET' && url.pathname === '/goals') return json(res, 200, Object.values(snapshot().operational.goals));

    if (req.method === 'POST' && url.pathname === '/tasks') return json(res, 201, core.createTask(await readJson(req)));
    if (req.method === 'GET' && url.pathname === '/tasks') return json(res, 200, Object.values(snapshot().operational.tasks));

    const getTaskMatch = url.pathname.match(/^\/tasks\/([^/]+)$/);
    if (req.method === 'GET' && getTaskMatch) {
      const task = snapshot().operational.tasks[getTaskMatch[1]];
      return task ? json(res, 200, task) : json(res, 404, { error: 'task_not_found' });
    }

    const assignMatch = url.pathname.match(/^\/tasks\/([^/]+)\/assign$/);
    if (req.method === 'POST' && assignMatch) {
      const body = await readJson(req);
      return json(res, 200, core.assignTask({ worldId: body.worldId, taskId: assignMatch[1], assignedTo: body.assignedTo }));
    }

    const cancelMatch = url.pathname.match(/^\/tasks\/([^/]+)\/cancel$/);
    if (req.method === 'POST' && cancelMatch) {
      const body = await readJson(req);
      return json(res, 200, core.cancelTask({ worldId: body.worldId, taskId: cancelMatch[1], reason: body.reason }));
    }

    const reviewMatch = url.pathname.match(/^\/tasks\/([^/]+)\/review$/);
    if (req.method === 'POST' && reviewMatch) {
      const body = await readJson(req);
      return json(res, 200, core.reviewTask({ worldId: body.worldId, taskId: reviewMatch[1], reviewState: body.reviewState, comment: body.comment }));
    }

    if (req.method === 'POST' && url.pathname === '/handoffs') return json(res, 201, core.createHandoff(await readJson(req)));
    if (req.method === 'POST' && url.pathname === '/runs/start') return json(res, 201, core.startRun(await readJson(req)));

    const retryRunMatch = url.pathname.match(/^\/runs\/([^/]+)\/retry$/);
    if (req.method === 'POST' && retryRunMatch) {
      const body = await readJson(req);
      return json(res, 201, core.retryRun({ worldId: body.worldId, runId: retryRunMatch[1] }));
    }

    const stopRunMatch = url.pathname.match(/^\/runs\/([^/]+)\/stop$/);
    if (req.method === 'POST' && stopRunMatch) {
      const body = await readJson(req);
      return json(res, 200, core.stopRun({ worldId: body.worldId, runId: stopRunMatch[1] }));
    }

    if (req.method === 'POST' && url.pathname === '/artifacts') return json(res, 201, core.createArtifact(await readJson(req)));
    if (req.method === 'GET' && url.pathname === '/artifacts') return json(res, 200, Object.values(snapshot().operational.artifacts));

    const projectionOp = url.pathname.match(/^\/worlds\/([^/]+)\/projection\/operational$/);
    if (req.method === 'GET' && projectionOp) return json(res, 200, snapshot().operational);

    const projectionSp = url.pathname.match(/^\/worlds\/([^/]+)\/projection\/spatial$/);
    if (req.method === 'GET' && projectionSp) return json(res, 200, snapshot().spatial);

    if (req.method === 'POST' && url.pathname === '/runtime/connect/openclaw') {
      const body = await readJson(req);
      return json(res, 200, core.connectRuntime({ ...body, runtimeType: 'openclaw' }));
    }

    if (req.method === 'POST' && url.pathname === '/runtime/connect/custom') {
      const body = await readJson(req);
      return json(res, 200, core.connectRuntime({ ...body, runtimeType: 'custom' }));
    }

    return json(res, 404, { error: 'not_found', path: url.pathname });
  } catch (error) {
    return json(res, 500, { error: 'internal_error', message: error.message });
  }
});

server.listen(config.portApi, () => logger.info('api_started', { port: config.portApi }));
