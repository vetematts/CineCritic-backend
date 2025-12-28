const isTest = process.env.NODE_ENV === 'test';

function log(level, ...args) {
  if (isTest) return; // silence logs during tests
  console[level](...args);
}

export const logger = {
  info: (...args) => log('log', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
};
