import log from './../log.js';

export default class ServicesManager {
  constructor() {
    this.services = {};
    this.registeredServiceNames = [];
  }

  /**
   *
   * @param {Object} service
   */
  registerService(service) {
    if (!service) {
      log.warn(
        'Attempting to register a null/undefined service. Exiting early.'
      );
      return;
    }

    let serviceName = service.name;

    if (!serviceName) {
      log.warn(`Service name not set. Exiting early.`);
      return;
    }

    if (this.registeredServiceNames.includes(serviceName)) {
      log.warn(
        `Extension name ${serviceName} has already been registered. Exiting before duplicating services.`
      );
      return;
    }

    this.services[service.name] = service;

    // Track service registration
    this.registeredServiceNames.push(serviceName);
  }

  /**
   * An array of services.
   *
   * @param {Object[]} services - Array of services
   */
  registerServices(services) {
    services.forEach(service => this.registerService(service));
  }
}
