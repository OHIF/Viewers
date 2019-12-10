import ServicesManager from './ServicesManager.js';
import log from '../log.js';

jest.mock('./../log.js');

describe('ServicesManager.js', () => {
  let servicesManager;

  beforeEach(() => {
    servicesManager = new ServicesManager();
    log.warn.mockClear();
    jest.clearAllMocks();
  });

  describe('registerServices()', () => {
    it('calls registerService() for each service', () => {
      servicesManager.registerService = jest.fn();

      const fakeServices = [
        { name: 'UINotificationTestService', hide: jest.fn() },
        { name: 'UIModalTestService', hide: jest.fn() },
      ];

      servicesManager.registerServices(fakeServices);

      expect(servicesManager.registerService.mock.calls.length).toBe(2);
    });
  });

  describe('registerService()', () => {
    it('logs a warning if the service is null or undefined', () => {
      const undefinedService = undefined;
      const nullService = null;

      servicesManager.registerService(undefinedService);
      servicesManager.registerService(nullService);

      expect(log.warn.mock.calls.length).toBe(2);
    });

    it('logs a warning if the service does not have a name', () => {
      const serviceWithEmptyName = { name: '', hide: jest.fn() };
      const serviceWithoutName = { hide: jest.fn() };

      servicesManager.registerService(serviceWithEmptyName);
      servicesManager.registerService(serviceWithoutName);

      expect(log.warn.mock.calls.length).toBe(2);
    });

    it('tracks which services have been registered', () => {
      const service = {
        name: 'UINotificationService',
      };

      servicesManager.registerService(service);

      expect(servicesManager.registeredServiceNames).toContain(service.name);
    });

    it('logs a warning if the service has an name that has already been registered', () => {
      const service = { name: 'UINotificationService' };

      servicesManager.registerService(service);
      servicesManager.registerService(service);

      expect(log.warn.mock.calls.length).toBe(1);
    });
  });
});
