import { RuntimeAdapterContract } from '../../runtime-adapter-core/src/index.js';

export class OpenClawAdapter extends RuntimeAdapterContract {
  constructor({ gatewayUrl = 'ws://127.0.0.1:3900', token = null } = {}) {
    super();
    this.gatewayUrl = gatewayUrl;
    this.token = token;
    this.runs = new Map();
  }

  createAgentBinding(input) { return { bindingId: `oc_bind_${Date.now()}`, ...input, runtimeType: 'openclaw' }; }
  updateAgentBinding(input) { return input; }
  deleteAgentBinding(input) { return { ok: true, ...input }; }
  startRun(input) {
    const run = { runtimeRunId: `oc_run_${Date.now()}`, status: 'running', ...input };
    this.runs.set(run.runtimeRunId, run);
    return run;
  }
  stopRun({ runtimeRunId }) { const run = this.runs.get(runtimeRunId); if (run) run.status = 'stopped'; return run; }
  pauseRun({ runtimeRunId }) { const run = this.runs.get(runtimeRunId); if (run) run.status = 'paused'; return run; }
  resumeRun({ runtimeRunId }) { const run = this.runs.get(runtimeRunId); if (run) run.status = 'running'; return run; }
  sendContext(input) { return { ok: true, ...input }; }
  requestApproval(input) { return { approved: true, ...input }; }
  getRunStatus({ runtimeRunId }) { return this.runs.get(runtimeRunId) ?? { runtimeRunId, status: 'unknown' }; }
  streamRuntimeEvents() { return []; }
  collectArtifacts(input) { return { artifacts: [], ...input }; }
  syncAgentState(input) { return { ok: true, ...input }; }
  healthCheck() { return { status: 'ok', gatewayUrl: this.gatewayUrl, runtime: 'openclaw' }; }
}
