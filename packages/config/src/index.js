export function loadConfig(env = process.env) {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    portApi: Number(env.PORT_API ?? 8080),
    portWeb: Number(env.PORT_WEB ?? 3000),
    redisUrl: env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    pgUrl: env.PG_URL ?? 'postgres://postgres:postgres@127.0.0.1:5432/agentspan',
    s3Endpoint: env.S3_ENDPOINT ?? 'http://127.0.0.1:9000',
    openclawGatewayUrl: env.OPENCLAW_GATEWAY_URL ?? 'ws://127.0.0.1:3900'
  };
}
