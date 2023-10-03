import log from './../log.js';

export default class ServicesProvidersManager {
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
