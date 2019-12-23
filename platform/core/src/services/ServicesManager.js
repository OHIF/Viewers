import log from './../log.js';

export default class ServicesManager {
  constructor() {
    this.services = {};
    this.registeredServiceNames = [];
  }

  /**
   * Registers a new service.
   *
   * @param {Object} service
   * @param {Object} configuration
   */
  registerService(service, configuration = {}) {
    if (!service) {
      log.warn(
        'Attempting to register a null/undefined service. Exiting early.'
      );
      return;
    }

    if (!service.name) {
      log.warn(`Service name not set. Exiting early.`);
      return;
    }

    if (this.registeredServiceNames.includes(service.name)) {
      log.warn(
        `Service name ${service.name} has already been registered. Exiting before duplicating services.`
      );
      return;
    }

    if (service.create) {
      this.services[service.name] = service.create({
        configuration,
      });
    } else {
      log.warn(`Service create factory function not defined. Exiting early.`);
      return;
    }

    /* Track service registration */
    this.registeredServiceNames.push(service.name);
  }

  /**
   * An array of services, or an array of arrays that contains service
   * configuration pairs.
   *
   * @param {Object[]} services - Array of services
   */
  registerServices(services) {
    services.forEach(service => {
      const hasConfiguration = Array.isArray(service);

      if (hasConfiguration) {
        const [ohifService, configuration] = service;
        this.registerService(ohifService, configuration);
      } else {
        this.registerService(service);
      }
    });
  }
}
