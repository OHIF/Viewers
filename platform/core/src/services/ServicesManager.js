export default class ServicesManager {
  constructor() {
    this.services = {};
  }

  register(service) {
    this.services[service.name] = service;
  }
}
