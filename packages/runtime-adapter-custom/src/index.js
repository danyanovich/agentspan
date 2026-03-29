import { RuntimeAdapterContract } from '../../runtime-adapter-core/src/index.js';

export class CustomRuntimeAdapter extends RuntimeAdapterContract {
  constructor() {
    super();
    this.runs = new Map();
  }

  createAgentBinding(input) { return { bindingId: `custom_bind_${Date.now()}`, runtimeType: 'custom', ...input }; }
  updateAgentBinding(input) { return input; }
  deleteAgentBinding(input) { return { ok: true, ...input }; }
  startRun(input) {
    const run = { runtimeRunId: `custom_run_${Date.now()}`, status: 'running', ...input };
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
  healthCheck() {
    return { status: 'ok', runtime: 'custom' };
  }
}
