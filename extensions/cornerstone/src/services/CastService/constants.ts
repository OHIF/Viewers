/**
 * CastService timing and tuning constants.
 */

/** Throttle annotation update publishes (ms) – max 5 per second per annotation. */
export const ANNOTATION_THROTTLE_MS = 200;

/** Interval (ms) for checking WebSocket and attempting reconnect when autoReconnect is enabled. */
export const RECONNECT_INTERVAL_MS = 10_000;

/** Timeout (ms) for subscribe/unsubscribe HTTP requests. */
export const SUBSCRIBE_TIMEOUT_MS = 5000;

export const LOG_PREFIX = 'CastService';
export const CAST_CLIENT_LOG_PREFIX = 'CastClient';
