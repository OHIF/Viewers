import PubSub from './PubSub';

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

export default new LogManager();
