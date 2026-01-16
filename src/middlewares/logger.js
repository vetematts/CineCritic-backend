import { logger } from '../utils/errorLogger.js';

/**
 * Request logging middleware.
 * Logs HTTP method, URL, status code, response time, and client IP.
 * Logs after response is sent to capture final status code.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url, ip } = req;

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const logMessage = `${method} ${url} ${statusCode} ${duration}ms - ${ip}`;

    // Use different log levels based on status code
    if (statusCode >= 500) {
      logger.error(logMessage);
    } else if (statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  });

  next();
}
