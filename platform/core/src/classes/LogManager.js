import PubSub from './PubSub';

/** Log Events */
export const LogEvents = Object.freeze({
  OnLog: 'onLog',
});

/**
 * Log manager that implements pub/sub.
 * This manager can be used to send logs across different packages
 * using previously registered events.
 */
class LogManager extends PubSub {
  EVENTS = LogEvents;
}

/** Singleton */
export default new LogManager();
