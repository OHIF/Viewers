import ExtensionManager from './ExtensionManager';
import MODULE_TYPES from './MODULE_TYPES';
import log from './../log.js';

jest.mock('./../log.js');

describe('ExtensionManager.ts', () => {
  let extensionManager, commandsManager, servicesManager, appConfig;

  beforeEach(() => {
    commandsManager = {
      createContext: jest.fn(),
      getContext: jest.fn(),
      registerCommand: jest.fn(),
    };
    servicesManager = {
      registerService: jest.fn(),
      services: {
        // Required for DataSource Module initiation
        UserAuthenticationService: jest.fn(),
        HangingProtocolService: {
          addProtocol: jest.fn(),
        },
      },
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
    it('calls registerExtension() for each extension', async () => {
      extensionManager.registerExtension = jest.fn();

      // SUT
      const fakeExtensions = [{ one: '1' }, { two: '2' }, { three: '3 ' }];
      await extensionManager.registerExtensions(fakeExtensions);

      // Assert
      expect(extensionManager.registerExtension.mock.calls.length).toBe(3);
    });

    it('calls registerExtension() for each extension passing its configuration if tuple', async () => {
      const fakeConfiguration = { testing: true };
      extensionManager.registerExtension = jest.fn();

      // SUT
      const fakeExtensions = [{ one: '1' }, [{ two: '2' }, fakeConfiguration], { three: '3 ' }];
      await extensionManager.registerExtensions(fakeExtensions);

      // Assert
      expect(extensionManager.registerExtension.mock.calls[1][1]).toEqual(fakeConfiguration);
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
        extensionManager,
        appConfig,
        configuration: extensionConfiguration,
      });
    });

    it('logs a warning if the extension is null or undefined', async () => {
      const undefinedExtension = undefined;
      const nullExtension = null;

      await expect(extensionManager.registerExtension(undefinedExtension)).rejects.toThrow(
        new Error('Attempting to register a null/undefined extension.')
      );

      await expect(extensionManager.registerExtension(nullExtension)).rejects.toThrow(
        new Error('Attempting to register a null/undefined extension.')
      );
    });

    it('logs a warning if the extension does not have an id', async () => {
      const extensionWithoutId = {};

      await expect(extensionManager.registerExtension(extensionWithoutId)).rejects.toThrow(
        new Error('Extension ID not set')
      );
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
      expect(log.warn.mock.calls[0][0]).toContain('Null or undefined returned when registering');
    });

    it('logs an error if an exception is thrown while retrieving a module', async () => {
      const extensionWithBadModule = {
        id: 'hello-world',
        getViewportModule: () => {
          throw new Error('Hello World');
        },
      };

      await expect(extensionManager.registerExtension(extensionWithBadModule)).rejects.toThrow();
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
            extensionManager,
          });
        }
      });
    });

    it('successfully registers a module for each module type', async () => {
      const extension = {
        id: 'hello-world',
        getViewportModule: () => {
          return [{ name: 'test' }];
        },
        getSopClassHandlerModule: () => {
          return [{ name: 'test' }];
        },
        getPanelModule: () => {
          return [{ name: 'test' }];
        },
        getToolbarModule: () => {
          return [{ name: 'test' }];
        },
        getCommandsModule: () => {
          return [{ name: 'test' }];
        },
        getLayoutTemplateModule: () => {
          return [{ name: 'test' }];
        },
        getDataSourcesModule: () => {
          return [{ name: 'test' }];
        },
        getHangingProtocolModule: () => {
          return [{ name: 'test' }];
        },
        getContextModule: () => {
          return [{ name: 'test' }];
        },
        getUtilityModule: () => {
          return [{ name: 'test' }];
        },
        getCustomizationModule: () => {
          return [{ name: 'test' }];
        },
        getStateSyncModule: () => {
          return [{ name: 'test' }];
        },
      };

      await extensionManager.registerExtension(extension);

      // Registers 1 module per module type
      Object.keys(extensionManager.modules).forEach(moduleType => {
        const modulesForType = extensionManager.modules[moduleType];
        console.log('moduleType', moduleType);
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
