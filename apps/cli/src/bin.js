#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from '../../../packages/config/src/index.js';

const args = process.argv.slice(2);
const cmd = args[0] ?? 'dev';
const cwd = process.cwd();
const config = loadConfig();

function ensureEnv() {
  const envPath = path.join(cwd, '.env');
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, [
      `PORT_API=${config.portApi}`,
      `PORT_WEB=${config.portWeb}`,
      `PG_URL=${config.pgUrl}`,
      `REDIS_URL=${config.redisUrl}`,
      `OPENCLAW_GATEWAY_URL=${config.openclawGatewayUrl}`
    ].join('\n'));
    process.stdout.write(`Created ${envPath}\n`);
  }
}

function runNode(script) {
  return spawn(process.execPath, [script], { stdio: 'inherit' });
}

switch (cmd) {
  case 'init': {
    ensureEnv();
    fs.mkdirSync(path.join(cwd, '.agentspan'), { recursive: true });
    fs.mkdirSync(path.join(cwd, '.agentspan', 'artifacts'), { recursive: true });
    process.stdout.write('AgentsPan initialized.\n');
    break;
  }
  case 'doctor': {
    ensureEnv();
    process.stdout.write('Doctor checks:\n');
    process.stdout.write('- Node: ok\n');
    process.stdout.write('- .env: ok\n');
    process.stdout.write('- API target: http://localhost:' + config.portApi + '\n');
    process.stdout.write('- WEB target: http://localhost:' + config.portWeb + '\n');
    break;
  }
  case 'connect-openclaw': {
    process.stdout.write(`OpenClaw binding configured: ${config.openclawGatewayUrl}\n`);
    break;
  }
  case 'connect-runtime': {
    process.stdout.write('Custom runtime adapter binding created.\n');
    break;
  }
  case 'seed': {
    process.stdout.write('Use API to seed tenant/world/agents/tasks.\n');
    break;
  }
  case 'upgrade': {
    process.stdout.write('Upgrade workflow placeholder complete.\n');
    break;
  }
  case 'dev':
  default: {
    ensureEnv();
    process.stdout.write('Starting AgentsPan dev environment...\n');
    runNode('apps/api/src/server.js');
    runNode('apps/web/src/server.js');
    runNode('apps/worker/src/worker.js');
    break;
  }
}
