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
    :root {
      --bg:#F5F5F7; --surface:#ffffff; --surface-soft:#fafbff; --text:#111317; --muted:#5F6672; --border:#E5E7EB;
      --active:#5B8CFF; --warning:#D9A441; --error:#C85D5D; --success:#49B675;
      --shadow: 0 1px 2px rgba(17,19,23,.04);
      --radius: 18px;
      --space: 16px;
    }

    body.theme-dark {
      --bg:#0F1115; --surface:#151922; --surface-soft:#1a202d; --text:#F3F5F7; --muted:#98A2B3; --border:#262B36;
      --active:#6E95FF; --warning:#D9A441; --error:#D07373; --success:#57C78A;
      --shadow: 0 1px 2px rgba(0,0,0,.3);
    }

    * { box-sizing: border-box; }
    body {
      margin:0; font-family: Inter, system-ui, -apple-system, sans-serif;
      background:var(--bg); color:var(--text);
    }

    .app {
      display:grid;
      grid-template-columns:220px 1fr 320px;
      height:100vh;
      gap:var(--space);
      padding:var(--space);
    }

    .panel {
      background:var(--surface);
      border:1px solid var(--border);
      border-radius:var(--radius);
      padding:14px;
      overflow:auto;
      box-shadow:var(--shadow);
    }

    .brand { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; }
    .brand h3 { margin:0; font-size:18px; }

    .icon-btn {
      border:1px solid var(--border);
      background:var(--surface);
      color:var(--muted);
      border-radius:10px;
      padding:6px 9px;
      cursor:pointer;
      font-size:12px;
    }

    .sidebar button {
      width:100%; text-align:left; border:0; background:transparent; margin:2px 0;
      color:var(--muted); padding:9px 10px; border-radius:10px; cursor:pointer;
      font-size:13px;
    }

    .sidebar button.active {
      background:color-mix(in srgb, var(--active) 16%, transparent);
      color:var(--text);
      font-weight:600;
    }

    .topbar { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px; }
    .topbar-actions { display:flex; align-items:center; gap:8px; }

    .quick {
      flex:1; border:1px solid var(--border); border-radius:12px;
      padding:9px 10px; color:var(--muted); background:var(--surface);
      min-width: 120px;
    }

    .mode { display:flex; gap:6px; }
    .mode button {
      border:1px solid var(--border);
      background:var(--surface);
      color:var(--muted);
      padding:6px 10px;
      border-radius:999px;
      cursor:pointer;
      font-size:12px;
    }

    .mode .active { background:var(--active); color:#fff; border-color:var(--active); }

    .metric {
      display:inline-flex; align-items:center;
      margin-right:6px; margin-bottom:6px;
      padding:4px 8px; border-radius:999px;
      border:1px solid var(--border); font-size:12px; color:var(--muted);
    }

    .metric strong { color:var(--text); margin-left:6px; }

    .list { border:1px solid var(--border); border-radius:12px; margin-top:10px; overflow:hidden; }
    .row {
      padding:9px 11px; border-bottom:1px solid var(--border); font-size:13px;
      display:flex; justify-content:space-between; align-items:center; gap:8px;
      background:var(--surface);
    }
    .row:last-child { border-bottom:0; }
    .row.clickable { cursor:pointer; }
    .row.clickable:hover { background:var(--surface-soft); }

    .world {
      position:relative;
      background:var(--surface-soft);
      border:1px solid var(--border);
      border-radius:12px;
      height:56vh;
      min-height:340px;
      overflow:hidden;
      margin-top:8px;
    }

    .zone { position:absolute; border:1px solid var(--border); border-radius:14px; background:var(--surface); padding:6px; font-size:11px; color:var(--muted); }
    .station { position:absolute; width:10px; height:10px; border-radius:4px; background:#ccd6f8; border:1px solid #9db0f0; }
    body.theme-dark .station { background:#3d4f7f; border-color:#5c71a5; }
    .agent { position:absolute; width:12px; height:8px; border-radius:999px; background:var(--active); box-shadow:0 0 8px color-mix(in srgb, var(--active) 45%, transparent); }
    .artifact { position:absolute; width:10px; height:10px; border-radius:3px; background:var(--success); }
    .link { position:absolute; height:2px; background:color-mix(in srgb, var(--active) 22%, var(--border)); transform-origin:0 0; }

    .status-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; }
    .muted { color:var(--muted); }
    .pre { white-space:pre-wrap; font-size:12px; color:var(--muted); line-height:1.45; }

    .mobile-top {
      display:none;
      position:sticky;
      top:0;
      z-index:20;
      background:var(--bg);
      padding:10px var(--space) 0;
      gap:8px;
      align-items:center;
    }

    .drawer {
      position:fixed;
      inset:0 auto 0 0;
      width:min(78vw, 280px);
      transform:translateX(-102%);
      transition:transform .22s ease;
      z-index:35;
      background:var(--bg);
      padding:var(--space);
      border-right:1px solid var(--border);
    }
    .drawer.open { transform:translateX(0); }
    .backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,.28); z-index:30; display:none;
    }
    .backdrop.show { display:block; }

    .tour-overlay {
      position:fixed; inset:0; background:rgba(8,10,16,.45); z-index:120; display:none;
    }
    .tour-overlay.active { display:block; }

    .tour-highlight {
      position:fixed;
      border:2px solid var(--active);
      border-radius:12px;
      box-shadow:0 0 0 9999px rgba(8,10,16,.45);
      z-index:121;
      pointer-events:none;
      transition:all .2s ease;
      display:none;
    }

    .tour-card {
      position:fixed;
      z-index:122;
      background:var(--surface);
      color:var(--text);
      border:1px solid var(--border);
      border-radius:14px;
      max-width:min(420px, calc(100vw - 24px));
      padding:12px;
      box-shadow:var(--shadow);
      display:none;
    }

    .tour-card h4 { margin:0 0 8px; font-size:14px; }
    .tour-card p { margin:0 0 10px; font-size:13px; color:var(--muted); line-height:1.45; }
    .tour-actions { display:flex; gap:8px; justify-content:flex-end; }

    .btn {
      border:1px solid var(--border); border-radius:10px; background:var(--surface);
      color:var(--text); padding:6px 10px; font-size:12px; cursor:pointer;
    }
    .btn.primary { background:var(--active); border-color:var(--active); color:#fff; }

    @media (max-width: 1180px) {
      .app { grid-template-columns:200px 1fr 300px; }
    }

    @media (max-width: 980px) {
      .app {
        grid-template-columns:1fr;
        grid-template-areas:
          "main"
          "right";
        height:auto;
        min-height:100vh;
        padding:10px;
        gap:10px;
      }
      .mobile-top { display:flex; }
      .sidebar.panel { display:none; }
      .main.panel { grid-area:main; }
      .right.panel { grid-area:right; }
      .world { height:52vh; min-height:300px; }
    }

    @media (max-width: 640px) {
      :root { --space: 10px; --radius: 14px; }
      .panel { padding:12px; }
      .topbar {
        flex-direction:column;
        align-items:stretch;
      }
      .topbar-actions {
        justify-content:space-between;
      }
      .mode { width:100%; }
      .mode button { flex:1; }
      .quick { font-size:12px; }
      .row { font-size:12px; padding:8px 10px; }
      .world { min-height:260px; height:48vh; }
    }
  </style>
</head>
<body>
  <div class="mobile-top">
    <button class="icon-btn" id="openDrawer">☰ Меню</button>
    <button class="icon-btn" id="mobileTheme">🌓 Тема</button>
    <button class="icon-btn" id="mobileTour">❔ Обучение</button>
  </div>

  <div class="drawer" id="drawer"></div>
  <div class="backdrop" id="backdrop"></div>

  <div class="app">
    <aside class="panel sidebar" id="sidebar"></aside>

    <main class="panel main" id="mainPanel">
      <div class="topbar" data-tour="topbar">
        <input class="quick" data-tour="quick" value="QuickCommand: create task / assign / handoff / retry" readonly />
        <div class="topbar-actions">
          <div class="mode" id="mode" data-tour="mode-switch"></div>
          <button class="icon-btn" id="themeBtn" data-tour="theme-toggle">🌓 Theme</button>
          <button class="icon-btn" id="tourBtn" data-tour="tour-start">Обучение</button>
        </div>
      </div>

      <div data-tour="metrics">
        <span class="metric">Agents <strong id="mAgents">0</strong></span>
        <span class="metric">Goals <strong id="mGoals">0</strong></span>
        <span class="metric">Tasks <strong id="mTasks">0</strong></span>
        <span class="metric">Runs <strong id="mRuns">0</strong></span>
        <span class="metric">Artifacts <strong id="mArtifacts">0</strong></span>
      </div>

      <div id="content"></div>
    </main>

    <aside class="panel right" id="rightPanel" data-tour="context-panel">
      <h4 style="margin:0 0 8px">ContextPanel</h4>
      <div id="context" class="pre">Выберите сущность в списке или на карте.</div>
      <h4 style="margin:12px 0 6px">Alerts</h4>
      <div id="alerts" class="list"></div>
      <h4 style="margin:12px 0 6px">Latest events</h4>
      <div id="events" class="list"></div>
    </aside>
  </div>

  <div class="tour-overlay" id="tourOverlay"></div>
  <div class="tour-highlight" id="tourHighlight"></div>
  <div class="tour-card" id="tourCard">
    <h4 id="tourTitle"></h4>
    <p id="tourText"></p>
    <div class="tour-actions">
      <button class="btn" id="tourSkip">Пропустить</button>
      <button class="btn primary" id="tourNext">Далее</button>
    </div>
  </div>

  <script>
    const screens = ['Home','Agents','Goals','Tasks','Runs','Artifacts','Events','World','Settings'];
    const state = {
      screen: 'Home',
      mode: 'Operational',
      selectedId: null,
      op: null,
      sp: null,
      theme: localStorage.getItem('agentspan-theme') || 'light',
      tourIndex: 0,
      tourRunning: false
    };

    const tourSteps = [
      {
        target: '[data-tour="topbar"]',
        title: 'Верхняя панель',
        text: 'Здесь быстрый ввод, переключение режимов, смена темы и запуск обучения.'
      },
      {
        target: '[data-tour="mode-switch"]',
        title: 'Режимы Operational / Spatial',
        text: 'Operational — для действий, Spatial — для понимания картины мира. Переключение мгновенное.'
      },
      {
        target: '[data-tour="metrics"]',
        title: 'Ключевые метрики',
        text: 'Следите за агентами, задачами, раннами и артефактами без перегруза интерфейса.'
      },
      {
        target: '#sidebar, #drawer',
        title: 'Навигация',
        text: 'Слева основные экраны. На телефоне они в боковом меню.'
      },
      {
        target: '#content',
        title: 'Рабочая область',
        text: 'Списки в Operational и карта мира в Spatial используют одно и то же состояние системы.'
      },
      {
        target: '[data-tour="context-panel"]',
        title: 'Контекст и события',
        text: 'Справа — детали выбранной сущности, алерты и последние события.'
      }
    ];

    function applyTheme() {
      document.body.classList.toggle('theme-dark', state.theme === 'dark');
      localStorage.setItem('agentspan-theme', state.theme);
    }

    function el(tag, attrs = {}, text = '') {
      const node = document.createElement(tag);
      Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k, v));
      if (text) node.textContent = text;
      return node;
    }

    function closeDrawer() {
      document.getElementById('drawer').classList.remove('open');
      document.getElementById('backdrop').classList.remove('show');
    }

    function openDrawer() {
      document.getElementById('drawer').classList.add('open');
      document.getElementById('backdrop').classList.add('show');
    }

    function renderNav(targetId) {
      const host = document.getElementById(targetId);
      host.innerHTML = '';
      const isDrawer = targetId === 'drawer';
      const brand = el('div', { class: 'brand' });
      brand.appendChild(el('h3', {}, 'AgentsPan'));
      if (isDrawer) {
        const close = el('button', { class: 'icon-btn' }, '✕');
        close.onclick = closeDrawer;
        brand.appendChild(close);
      }
      host.appendChild(brand);

      for (const screen of screens) {
        const btn = el('button', { class: state.screen === screen ? 'active' : '', 'data-tour': screen === 'World' ? 'world-screen' : '' }, screen);
        btn.onclick = () => {
          state.screen = screen;
          if (screen === 'World') state.mode = 'Spatial';
          closeDrawer();
          render();
        };
        host.appendChild(btn);
      }
    }

    function renderModeSwitch() {
      const mode = document.getElementById('mode');
      mode.innerHTML = '';
      ['Operational', 'Spatial'].forEach((name) => {
        const btn = el('button', { class: state.mode === name ? 'active' : '' }, name);
        btn.onclick = () => {
          state.mode = name;
          state.screen = name === 'Spatial' ? 'World' : state.screen === 'World' ? 'Home' : state.screen;
          render();
        };
        mode.appendChild(btn);
      });
    }

    function drawOperationalList(values, title) {
      const wrap = el('div');
      wrap.appendChild(el('h4', { style: 'margin:10px 0 0' }, title));
      const list = el('div', { class: 'list' });
      values.slice(0, 24).forEach((item) => {
        const row = el('div', { class: 'row clickable' });
        row.innerHTML = '<span>' + (item.title || item.name || item.id) + '</span><span class="muted">' + (item.status || item.priority || item.type || '-') + '</span>';
        row.onclick = () => {
          state.selectedId = item.id;
          document.getElementById('context').textContent = JSON.stringify(item, null, 2);
        };
        list.appendChild(row);
      });
      if (!values.length) list.appendChild(el('div', { class: 'row muted' }, 'No data yet'));
      wrap.appendChild(list);
      return wrap;
    }

    function drawWorld() {
      const world = el('div', { class: 'world', 'data-tour': 'world-map' });
      const zones = Object.values(state.sp?.zones || {});
      const stations = Object.values(state.sp?.stations || {});
      const links = Object.values(state.sp?.links || {});
      const agents = Object.values(state.sp?.agents || {});
      const artifacts = Object.values(state.sp?.artifacts || {});

      const cell = window.innerWidth < 640 ? 17 : window.innerWidth < 980 ? 20 : 24;
      const toPx = (v) => v * cell;

      links.forEach((link) => {
        const a = stations.find((s) => s.id === link.fromId);
        const b = stations.find((s) => s.id === link.toId);
        if (!a || !b) return;
        const dx = toPx(b.x) - toPx(a.x);
        const dy = toPx(b.y) - toPx(a.y);
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const line = el('div', { class: 'link' });
        line.style.left = toPx(a.x) + 'px';
        line.style.top = toPx(a.y) + 'px';
        line.style.width = len + 'px';
        line.style.transform = 'rotate(' + angle + 'deg)';
        world.appendChild(line);
      });

      zones.forEach((zone) => {
        const z = el('div', { class: 'zone' }, (zone.name || 'Zone') + ' (' + (zone.type || 'general') + ')');
        z.style.left = toPx(zone.x) + 'px';
        z.style.top = toPx(zone.y) + 'px';
        z.style.width = toPx(zone.w) + 'px';
        z.style.height = toPx(zone.h) + 'px';
        world.appendChild(z);
      });

      stations.forEach((station) => {
        const s = el('div', { class: 'station', title: station.id + ' | queue:' + (station.queueDepth || 0) });
        s.style.left = toPx(station.x) + 'px';
        s.style.top = toPx(station.y) + 'px';
        world.appendChild(s);
      });

      agents.forEach((agent, idx) => {
        const st = stations[idx % Math.max(1, stations.length)] || { x: 1, y: 1 };
        const a = el('div', { class: 'agent', title: agent.name + ' | ' + agent.status });
        a.style.left = (toPx(st.x) + 3) + 'px';
        a.style.top = (toPx(st.y) - 8) + 'px';
        a.onclick = () => {
          state.selectedId = agent.id;
          document.getElementById('context').textContent = JSON.stringify(agent, null, 2);
        };
        world.appendChild(a);
      });

      artifacts.forEach((artifact, idx) => {
        const st = stations[(idx + 2) % Math.max(1, stations.length)] || { x: 1, y: 1 };
        const a = el('div', { class: 'artifact', title: artifact.title + ' | ' + artifact.reviewState });
        a.style.left = (toPx(st.x) + 12) + 'px';
        a.style.top = (toPx(st.y) + 3) + 'px';
        world.appendChild(a);
      });

      return world;
    }

    function renderContent() {
      const content = document.getElementById('content');
      content.innerHTML = '';
      const op = state.op || { agents: {}, goals: {}, tasks: {}, runs: {}, artifacts: {}, events: [] };
      const map = {
        Home: drawOperationalList(op.events || [], 'Recent Events'),
        Agents: drawOperationalList(Object.values(op.agents || {}), 'Agents'),
        Goals: drawOperationalList(Object.values(op.goals || {}), 'Goals'),
        Tasks: drawOperationalList(Object.values(op.tasks || {}), 'Tasks'),
        Runs: drawOperationalList(Object.values(op.runs || {}), 'Runs'),
        Artifacts: drawOperationalList(Object.values(op.artifacts || {}), 'Artifacts'),
        Events: drawOperationalList(op.events || [], 'Events Feed'),
        World: drawWorld(),
        Settings: drawOperationalList([
          { id: 'theme', title: 'Theme', status: state.theme === 'dark' ? 'dark' : 'light' },
          { id: 'runtime', title: 'Runtime Bindings', status: 'openclaw/custom' },
          { id: 'scene', title: 'Scene Pack', status: state.op?.scenePack?.name || 'default-grid' }
        ], 'Settings')
      };
      content.appendChild(map[state.screen] || map.Home);
    }

    function renderRight() {
      const alerts = document.getElementById('alerts');
      const events = document.getElementById('events');
      alerts.innerHTML = '';
      events.innerHTML = '';

      (state.op?.alerts || []).slice(0, 5).forEach((event) => {
        const row = el('div', { class: 'row' });
        row.innerHTML = '<span><span class="status-dot" style="background:var(--warning)"></span>' + event.eventType + '</span>';
        alerts.appendChild(row);
      });

      (state.op?.events || []).slice(0, 8).forEach((event) => {
        const row = el('div', { class: 'row' });
        row.innerHTML = '<span>' + event.eventType + '</span><span class="muted">' + (event.createdAt || '').slice(11,19) + '</span>';
        events.appendChild(row);
      });

      if (!alerts.children.length) alerts.appendChild(el('div', { class: 'row muted' }, 'No alerts'));
      if (!events.children.length) events.appendChild(el('div', { class: 'row muted' }, 'No events'));
    }

    function renderMetrics() {
      const op = state.op || { agents: {}, goals: {}, tasks: {}, runs: {}, artifacts: {} };
      document.getElementById('mAgents').textContent = Object.keys(op.agents || {}).length;
      document.getElementById('mGoals').textContent = Object.keys(op.goals || {}).length;
      document.getElementById('mTasks').textContent = Object.keys(op.tasks || {}).length;
      document.getElementById('mRuns').textContent = Object.keys(op.runs || {}).length;
      document.getElementById('mArtifacts').textContent = Object.keys(op.artifacts || {}).length;
    }

    function getFirstVisibleElement(selectors) {
      for (const selector of selectors.split(',').map((x) => x.trim())) {
        const node = document.querySelector(selector);
        if (node && node.offsetParent !== null) return node;
      }
      return null;
    }

    function placeTourCard(targetRect) {
      const card = document.getElementById('tourCard');
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cardRect = card.getBoundingClientRect();
      let left = targetRect.left;
      let top = targetRect.bottom + 10;

      if (top + cardRect.height > vh - 10) top = Math.max(10, targetRect.top - cardRect.height - 10);
      if (left + cardRect.width > vw - 10) left = vw - cardRect.width - 10;
      left = Math.max(10, left);

      card.style.left = left + 'px';
      card.style.top = top + 'px';
    }

    function stopTour() {
      state.tourRunning = false;
      document.getElementById('tourOverlay').classList.remove('active');
      document.getElementById('tourHighlight').style.display = 'none';
      document.getElementById('tourCard').style.display = 'none';
    }

    function renderTourStep() {
      if (!state.tourRunning) return;
      const step = tourSteps[state.tourIndex];
      if (!step) {
        stopTour();
        return;
      }

      const target = getFirstVisibleElement(step.target);
      if (!target) {
        state.tourIndex += 1;
        renderTourStep();
        return;
      }

      const rect = target.getBoundingClientRect();
      const highlight = document.getElementById('tourHighlight');
      const card = document.getElementById('tourCard');

      highlight.style.display = 'block';
      highlight.style.left = Math.max(4, rect.left - 6) + 'px';
      highlight.style.top = Math.max(4, rect.top - 6) + 'px';
      highlight.style.width = Math.max(40, rect.width + 12) + 'px';
      highlight.style.height = Math.max(36, rect.height + 12) + 'px';

      document.getElementById('tourTitle').textContent = step.title;
      document.getElementById('tourText').textContent = step.text;
      card.style.display = 'block';
      document.getElementById('tourNext').textContent = state.tourIndex === tourSteps.length - 1 ? 'Готово' : 'Далее';
      placeTourCard(rect);
    }

    function startTour() {
      state.tourRunning = true;
      state.tourIndex = 0;
      document.getElementById('tourOverlay').classList.add('active');
      renderTourStep();
      localStorage.setItem('agentspan-tour-seen', '1');
    }

    function bindStaticActions() {
      document.getElementById('themeBtn').onclick = () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme();
        render();
      };
      document.getElementById('mobileTheme').onclick = () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme();
        render();
      };

      document.getElementById('tourBtn').onclick = startTour;
      document.getElementById('mobileTour').onclick = startTour;
      document.getElementById('tourSkip').onclick = stopTour;
      document.getElementById('tourNext').onclick = () => {
        state.tourIndex += 1;
        renderTourStep();
      };

      document.getElementById('openDrawer').onclick = openDrawer;
      document.getElementById('backdrop').onclick = closeDrawer;

      window.addEventListener('resize', () => {
        if (state.tourRunning) renderTourStep();
      });
    }

    function render() {
      renderNav('sidebar');
      renderNav('drawer');
      renderModeSwitch();
      renderMetrics();
      renderContent();
      renderRight();
      if (state.tourRunning) setTimeout(renderTourStep, 0);
    }

    async function refresh() {
      state.op = await fetch('http://localhost:8080/worlds/default/projection/operational').then(r=>r.json()).catch(()=>null);
      state.sp = await fetch('http://localhost:8080/worlds/default/projection/spatial').then(r=>r.json()).catch(()=>null);
      render();
    }

    applyTheme();
    bindStaticActions();
    refresh();
    setInterval(refresh, 1700);

    if (!localStorage.getItem('agentspan-tour-seen')) {
      setTimeout(() => startTour(), 900);
    }
  </script>
</body>
</html>`;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(config.portWeb, () => {
  process.stdout.write(`web_started:${config.portWeb}\n`);
});
