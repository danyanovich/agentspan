export function log(level, message, context = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, message, ...context });
  process.stdout.write(`${line}\n`);
}

export const logger = {
  info: (message, context) => log('info', message, context),
  warn: (message, context) => log('warn', message, context),
  error: (message, context) => log('error', message, context)
};
