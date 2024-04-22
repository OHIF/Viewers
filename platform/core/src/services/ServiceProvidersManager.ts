import log from './../log.js';

/**
 * The ServiceProvidersManager allows for a React context provider class to be registered
 * for a particular service. This allows for extensions to register services
 * with context providers and the providers will be instantiated and added to the
 * DOM dynamically.
 */
export default class ServiceProvidersManager {
  public providers = {};

  public constructor() {
    this.providers = {};
  }

  registerProvider(serviceName, provider) {
    if (!serviceName) {
      log.warn(
        'Attempting to register a provider to a null/undefined service name. Exiting early.'
      );
      return;
    }

    if (!provider) {
      log.warn('Attempting to register a null/undefined provider. Exiting early.');
      return;
    }

    this.providers[serviceName] = provider;
  }
}
