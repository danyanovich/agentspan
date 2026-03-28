import { logger } from '../../../packages/observability/src/index.js';

logger.info('worker_started', {
  capabilities: [
    'outbox_delivery',
    'projection_rebuild',
    'economy_recalculation',
    'alerts_aggregation'
  ]
});

setInterval(() => {
  logger.info('worker_heartbeat', { ts: new Date().toISOString() });
}, 10_000);
