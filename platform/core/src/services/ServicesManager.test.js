import ServicesManager from './ServicesManager';
import log from '../log';

jest.mock('./../log');

describe('ServicesManager', () => {
  let servicesManager, commandsManager;

  beforeEach(() => {
    commandsManager = {
      createContext: jest.fn(),
      getContext: jest.fn(),
      registerCommand: jest.fn(),
    };
    servicesManager = new ServicesManager(commandsManager);
    log.warn.mockClear();
    jest.clearAllMocks();
  });

  describe('registerServices()', () => {
    it('calls registerService() for each service', () => {
      servicesManager.registerService = jest.fn();

      servicesManager.registerServices([
        { name: 'UINotificationTestService', create: jest.fn() },
        { name: 'UIModalTestService', create: jest.fn() },
      ]);

      expect(servicesManager.registerService.mock.calls.length).toBe(2);
    });

    it('calls registerService() for each service passing its configuration if tuple', () => {
      servicesManager.registerService = jest.fn();
      const fakeConfiguration = { testing: true };

      servicesManager.registerServices([
        { name: 'UINotificationTestService', create: jest.fn() },
        [{ name: 'UIModalTestService', create: jest.fn() }, fakeConfiguration],
      ]);

      expect(servicesManager.registerService.mock.calls[1][1]).toEqual(fakeConfiguration);
    });
  });

  describe('registerService()', () => {
    const fakeService = { name: 'UINotificationService', create: jest.fn() };

    it('logs a warning if the service is null or undefined', () => {
      const undefinedService = undefined;
      const nullService = null;

      servicesManager.registerService(undefinedService);
      servicesManager.registerService(nullService);

      expect(log.warn.mock.calls.length).toBe(2);
    });

    it('logs a warning if the service does not have a name', () => {
      const serviceWithEmptyName = { name: '', create: jest.fn() };
      const serviceWithoutName = { create: jest.fn() };

      servicesManager.registerService(serviceWithEmptyName);
      servicesManager.registerService(serviceWithoutName);

      expect(log.warn.mock.calls.length).toBe(2);
    });

    it('logs a warning if the service does not have a create factory function', () => {
      const serviceWithoutCreate = { name: 'UINotificationService' };

      servicesManager.registerService(serviceWithoutCreate);

      expect(log.warn.mock.calls.length).toBe(1);
    });

    it('tracks which services have been registered', () => {
      servicesManager.registerService(fakeService);

      expect(servicesManager.registeredServiceNames).toContain(fakeService.name);
    });

    it('logs a warning if the service has an name that has already been registered', () => {
      servicesManager.registerService(fakeService);
      servicesManager.registerService(fakeService);

      expect(log.warn.mock.calls.length).toBe(1);
    });

    it('pass dependencies and configuration to service create factory function', () => {
      const configuration = { config: 'Some configuration' };

      servicesManager.registerService(fakeService, configuration);

      expect(fakeService.create.mock.calls[0][0].configuration.config).toBe(configuration.config);
    });
  });
});
