import ExtensionManager from './ExtensionManager.js';
import MODULE_TYPES from './MODULE_TYPES.js';
import log from './../log.js';

jest.mock('./../log.js');

describe('ExtensionManager.js', () => {
  let extensionManager, commandsManager, servicesManager, appConfig;

  beforeEach(() => {
    commandsManager = {
      createContext: jest.fn(),
      getContext: jest.fn(),
      registerCommand: jest.fn(),
    };
    servicesManager = {
      registerService: jest.fn(),
    };
    appConfig = {
      testing: true,
    };
    extensionManager = new ExtensionManager({
      servicesManager,
      commandsManager,
      appConfig,
    });
    log.warn.mockClear();
    jest.clearAllMocks();
  });

  it('creates a module namespace for each module type', () => {
    const moduleKeys = Object.keys(extensionManager.modules);
    const moduleTypeValues = Object.values(MODULE_TYPES);

    expect(moduleKeys.sort()).toEqual(moduleTypeValues.sort());
  });

  describe('registerExtensions()', () => {
    it('calls registerExtension() for each extension', () => {
      extensionManager.registerExtension = jest.fn();

      // SUT
      const fakeExtensions = [{ one: '1' }, { two: '2' }, { three: '3 ' }];
      extensionManager.registerExtensions(fakeExtensions);

      // Assert
      expect(extensionManager.registerExtension.mock.calls.length).toBe(3);
    });

    it('calls registerExtension() for each extension passing its configuration if tuple', () => {
      const fakeConfiguration = { testing: true };
      extensionManager.registerExtension = jest.fn();

      // SUT
      const fakeExtensions = [
        { one: '1' },
        [{ two: '2' }, fakeConfiguration],
        { three: '3 ' },
      ];
      extensionManager.registerExtensions(fakeExtensions);

      // Assert
      expect(extensionManager.registerExtension.mock.calls[1][1]).toEqual(
        fakeConfiguration
      );
    });
  });

  describe('registerExtension()', () => {
    it('calls preRegistration() for extension', () => {
      // SUT
      const fakeExtension = { id: '1', preRegistration: jest.fn() };
      extensionManager.registerExtension(fakeExtension);

      // Assert
      expect(fakeExtension.preRegistration.mock.calls.length).toBe(1);
    });

    it('calls preRegistration() passing dependencies and extension configuration to extension', () => {
      const extensionConfiguration = { config: 'Some configuration' };

      // SUT
      const extension = { id: '1', preRegistration: jest.fn() };
      extensionManager.registerExtension(extension, extensionConfiguration);

      // Assert
      expect(extension.preRegistration.mock.calls[0][0]).toEqual({
        servicesManager,
        commandsManager,
        appConfig,
        configuration: extensionConfiguration,
      });
    });

    it('logs a warning if the extension is null or undefined', () => {
      const undefinedExtension = undefined;
      const nullExtension = null;

      expect(() => {
        extensionManager.registerExtension(undefinedExtension);
      }).toThrow('Attempting to register a null/undefined extension.');


      expect(() => {
        extensionManager.registerExtension(nullExtension);
      }).toThrow('Attempting to register a null/undefined extension.');
    });

    it('logs a warning if the extension does not have an id', () => {
      const extensionWithoutId = {};

      expect(() => {
        extensionManager.registerExtension(extensionWithoutId);
      }).toThrow(new Error('Extension ID not set'));
    });

    it('tracks which extensions have been registered', () => {
      const extension = {
        id: 'hello-world',
      };

      extensionManager.registerExtension(extension);

      expect(extensionManager.registeredExtensionIds).toContain(extension.id);
    });

    it('logs a warning if the extension has an id that has already been registered', () => {
      const extension = { id: 'hello-world' };
      extensionManager.registerExtension(extension);

      // SUT
      extensionManager.registerExtension(extension);

      expect(log.warn.mock.calls.length).toBe(1);
    });

    it('logs a warning if a defined module returns null or undefined', () => {
      const extensionWithBadModule = {
        id: 'hello-world',
        getViewportModule: () => {
          return null;
        },
      };

      extensionManager.registerExtension(extensionWithBadModule);

      expect(log.warn.mock.calls.length).toBe(1);
      expect(log.warn.mock.calls[0][0]).toContain(
        'Null or undefined returned when registering'
      );
    });

    it('logs an error if an exception is thrown while retrieving a module', () => {
      const extensionWithBadModule = {
        id: 'hello-world',
        getViewportModule: () => {
          throw new Error('Hello World');
        },
      };

      expect(() => {
        extensionManager.registerExtension(extensionWithBadModule);
      }).toThrow();
    });

    it('successfully passes dependencies to each module along with extension configuration', () => {
      const extensionConfiguration = { testing: true };

      const extension = {
        id: 'hello-world',
        getViewportModule: jest.fn(),
        getSopClassHandlerModule: jest.fn(),
        getPanelModule: jest.fn(),
        getToolbarModule: jest.fn(),
        getCommandsModule: jest.fn(),
      };

      extensionManager.registerExtension(extension, extensionConfiguration);

      Object.keys(extension).forEach(module => {
        if (typeof extension[module] === 'function') {
          expect(extension[module].mock.calls[0][0]).toEqual({
            servicesManager,
            commandsManager,
            hotkeysManager: undefined,
            appConfig,
            configuration: extensionConfiguration,
            extensionManager
          });
        }
      });
    });

    it('successfully registers a module for each module type', () => {
      const extension = {
        id: 'hello-world',
        getViewportModule: () => {
          return [{}];
        },
        getSopClassHandlerModule: () => {
          return [{}];
        },
        getPanelModule: () => {
          return [{}];
        },
        getToolbarModule: () => {
          return [{}];
        },
        getCommandsModule: () => {
          return [{}];
        },
        getLayoutTemplateModule: () => {
          return [{}];
        },
        getDataSourcesModule: () => {
          return [{}];
        },
        getContextModule: () => {
          return [{}];
        }
      };

      extensionManager.registerExtension(extension);

      // Registers 1 module per module type
      Object.keys(extensionManager.modules).forEach(moduleType => {
        const modulesForType = extensionManager.modules[moduleType];

        expect(modulesForType.length).toBe(1);
      });
    });

    it('calls commandsManager.registerCommand for each commandsModule command definition', () => {
      const extension = {
        id: 'hello-world',
        getCommandsModule: () => {
          return {
            definitions: {
              exampleDefinition: {
                commandFn: () => {},
                storeContexts: [],
                options: {},
              },
            },
          };
        },
      };

      // SUT
      extensionManager.registerExtension(extension);

      expect(commandsManager.registerCommand.mock.calls.length).toBe(1);
    });

    it('logs a warning if the commandsModule contains no command definitions', () => {
      const extension = {
        id: 'hello-world',
        getCommandsModule: () => {
          return {};
        },
      };

      // SUT
      extensionManager.registerExtension(extension);

      expect(log.warn.mock.calls.length).toBe(1);
      expect(log.warn.mock.calls[0][0]).toContain(
        'Commands Module contains no command definitions'
      );
    });
  });
});
