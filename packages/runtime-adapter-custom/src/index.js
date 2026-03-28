import { RuntimeAdapterContract } from '../../runtime-adapter-core/src/index.js';

export class CustomRuntimeAdapter extends RuntimeAdapterContract {
  healthCheck() {
    return { status: 'ok', runtime: 'custom' };
  }
}
