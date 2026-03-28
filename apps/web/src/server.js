import http from 'node:http';
import { loadConfig } from '../../../packages/config/src/index.js';

const config = loadConfig();

const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgentsPan</title>
  <style>
    :root { --bg:#F5F5F7; --surface:#fff; --text:#111317; --muted:#5F6672; --border:#E5E7EB; --active:#5B8CFF; --warning:#D9A441; --error:#C85D5D; }
    body { margin:0; font-family: Inter, system-ui, sans-serif; background:var(--bg); color:var(--text); }
    .app { display:grid; grid-template-columns:220px 1fr 340px; height:100vh; gap:16px; padding:16px; box-sizing:border-box; }
    .panel { background:var(--surface); border:1px solid var(--border); border-radius:18px; padding:16px; overflow:auto; }
    .sidebar a { display:block; margin:6px 0; color:var(--muted); text-decoration:none; }
    .topbar { display:flex; justify-content:space-between; margin-bottom:12px; }
    .mode button { border:1px solid var(--border); background:#fff; padding:6px 10px; border-radius:999px; cursor:pointer; }
    .mode .active { background:var(--active); color:white; border-color:var(--active); }
    .world { display:grid; grid-template-columns: repeat(24, 1fr); gap:2px; background:#fff; border:1px solid var(--border); border-radius:12px; padding:8px; height:420px; }
    .cell { background:#f2f4f8; border-radius:4px; }
    .metric { display:inline-block; margin-right:8px; padding:4px 8px; border-radius:999px; border:1px solid var(--border); font-size:12px; }
  </style>
</head>
<body>
  <div class="app">
    <aside class="panel sidebar">
      <h3>AgentsPan</h3>
      <a href="#">Home</a><a href="#">Agents</a><a href="#">Goals</a><a href="#">Tasks</a><a href="#">Runs</a><a href="#">Artifacts</a><a href="#">Events</a><a href="#">World</a><a href="#">Settings</a>
    </aside>
    <main class="panel">
      <div class="topbar">
        <div><strong>World: Default</strong><div style="color:var(--muted);font-size:12px">Operational + Spatial over one event core</div></div>
        <div class="mode"><button class="active">Operational</button><button>Spatial</button></div>
      </div>
      <div>
        <span class="metric">Agents: <span id="mAgents">0</span></span>
        <span class="metric">Tasks: <span id="mTasks">0</span></span>
        <span class="metric">Runs: <span id="mRuns">0</span></span>
        <span class="metric">Artifacts: <span id="mArtifacts">0</span></span>
      </div>
      <h4>Spatial Preview (minimal 2D grid)</h4>
      <div class="world" id="world"></div>
    </main>
    <aside class="panel">
      <h4>Context panel</h4>
      <p style="color:var(--muted)">Selected entity details, alerts, queues, and runtime state.</p>
      <pre id="events" style="white-space:pre-wrap;font-size:12px"></pre>
    </aside>
  </div>
  <script>
    const world = document.getElementById('world');
    for (let i=0;i<24*14;i++){ const c=document.createElement('div'); c.className='cell'; world.appendChild(c); }

    async function refresh(){
      const op = await fetch('http://localhost:8080/worlds/default/projection/operational').then(r=>r.json()).catch(()=>({agents:{},tasks:{},runs:{},artifacts:{},events:[]}));
      document.getElementById('mAgents').textContent = Object.keys(op.agents||{}).length;
      document.getElementById('mTasks').textContent = Object.keys(op.tasks||{}).length;
      document.getElementById('mRuns').textContent = Object.keys(op.runs||{}).length;
      document.getElementById('mArtifacts').textContent = Object.keys(op.artifacts||{}).length;
      document.getElementById('events').textContent = (op.events||[]).slice(0,5).map(e=>`${e.eventType} @ ${e.createdAt}`).join('\n');
    }
    setInterval(refresh, 1500); refresh();
  </script>
</body>
</html>`;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(config.portWeb, () => {
  process.stdout.write(`web_started:${config.portWeb}\n`);
});
