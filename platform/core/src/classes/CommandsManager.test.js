import CommandsManager from './CommandsManager';
import log from './../log.js';

jest.mock('./../log.js');

describe('CommandsManager', () => {
  let commandsManager,
    contextName = 'VTK',
    command = {
      commandFn: jest.fn().mockReturnValue(true),
      options: { passMeToCommandFn: ':wave:' },
    },
    commandsManagerConfig = {
      getAppState: () => {
        return {
          viewers: 'Test',
        };
      },
    };

  beforeEach(() => {
    commandsManager = new CommandsManager(commandsManagerConfig);
    commandsManager.createContext('VIEWER');
    commandsManager.createContext('ACTIVE_VIEWER::CORNERSTONE');
    jest.clearAllMocks();
  });

  it('has a contexts property', () => {
    const localCommandsManager = new CommandsManager(commandsManagerConfig);

    expect(localCommandsManager).toHaveProperty('contexts');
    expect(localCommandsManager.contexts).toEqual({});
  });

  describe('createContext()', () => {
    it('creates a context', () => {
      commandsManager.createContext(contextName);

      expect(commandsManager.contexts).toHaveProperty(contextName);
    });

    it('clears the context if it already exists', () => {
      commandsManager.createContext(contextName);
      commandsManager.registerCommand(contextName, 'TestCommand', command);
      commandsManager.registerCommand(contextName, 'TestCommand2', command);
      commandsManager.createContext(contextName);

      const registeredCommands = commandsManager.getContext(contextName);

      expect(registeredCommands).toEqual({});
    });
  });

  describe('getContext()', () => {
    it('returns all registered commands for a context', () => {
      commandsManager.createContext(contextName);
      commandsManager.registerCommand(contextName, 'TestCommand', command);
      const registeredCommands = commandsManager.getContext(contextName);

      expect(registeredCommands).toHaveProperty('TestCommand');
      expect(registeredCommands['TestCommand']).toEqual(command);
    });
    it('returns undefined if the context does not exist', () => {
      const registeredCommands = commandsManager.getContext(contextName);

      expect(registeredCommands).toBe(undefined);
    });
  });

  describe('clearContext()', () => {
    it('clears all registered commands for a context', () => {
      commandsManager.createContext(contextName);
      commandsManager.registerCommand(contextName, 'TestCommand', command);
      commandsManager.registerCommand(contextName, 'TestCommand2', command);
      commandsManager.clearContext(contextName);

      const registeredCommands = commandsManager.getContext(contextName);

      expect(registeredCommands).toEqual({});
    });
  });

  describe('registerCommand()', () => {
    it('registers commands to a context', () => {
      commandsManager.createContext(contextName);
      commandsManager.registerCommand(contextName, 'TestCommand', command);
      const registeredCommands = commandsManager.getContext(contextName);

      expect(registeredCommands).toHaveProperty('TestCommand');
      expect(registeredCommands['TestCommand']).toEqual(command);
    });
  });

  describe('getCommand()', () => {
    it('returns undefined if context does not exist', () => {
      const result = commandsManager.getCommand('TestCommand', 'NonExistentContext');

      expect(result).toBe(undefined);
    });
    it('returns undefined if command does not exist in context', () => {
      commandsManager.createContext(contextName);
      const result = commandsManager.getCommand('TestCommand', contextName);

      expect(result).toBe(undefined);
    });
    it('uses contextName param to get command', () => {
      commandsManager.createContext('GLOBAL');
      commandsManager.registerCommand('GLOBAL', 'TestCommand', command);
      const foundCommand = commandsManager.getCommand('TestCommand', 'GLOBAL');

      expect(foundCommand).toBe(command);
    });
    it('uses activeContexts, if contextName is not provided, to get command', () => {
      commandsManager.registerCommand('VIEWER', 'TestCommand', command);
      const foundCommand = commandsManager.getCommand('TestCommand');

      expect(foundCommand).toBe(command);
    });
    it('returns the expected command', () => {
      commandsManager.createContext(contextName);
      commandsManager.registerCommand(contextName, 'TestCommand', command);
      const result = commandsManager.getCommand('TestCommand', contextName);

      expect(result).toEqual(command);
    });
  });

  describe('runCommand()', () => {
    it('Logs a warning if commandName not found in context', () => {
      const result = commandsManager.runCommand('CommandThatDoesNotExistInAnyContext');

      expect(result).toBe(undefined);
      expect(log.warn.mock.calls[0][0]).toEqual(
        'Command "CommandThatDoesNotExistInAnyContext" not found in current context'
      );
    });

    it('Logs a warning if command definition does not have a commandFn', () => {
      const commandWithNoCommmandFn = {
        commandFn: undefined,
        options: {},
      };

      commandsManager.createContext(contextName);
      commandsManager.registerCommand(contextName, 'TestCommand', commandWithNoCommmandFn);
      const result = commandsManager.runCommand('TestCommand', null, contextName);

      expect(result).toBe(undefined);
      expect(log.warn.mock.calls[0][0]).toEqual(
        'No commandFn was defined for command "TestCommand"'
      );
    });

    it('Calls commandFn', () => {
      commandsManager.registerCommand('VIEWER', 'TestCommand', command);
      commandsManager.runCommand('TestCommand', {}, 'VIEWER');

      expect(command.commandFn.mock.calls.length).toBe(1);
    });

    it('Calls commandFn w/ command definition options', () => {
      commandsManager.registerCommand('VIEWER', 'TestCommand', command);
      commandsManager.runCommand('TestCommand', {}, 'VIEWER');

      expect(command.commandFn.mock.calls.length).toBe(1);
      expect(command.commandFn.mock.calls[0][0].passMeToCommandFn).toEqual(
        command.options.passMeToCommandFn
      );
    });

    it('Calls commandFn w/ runCommand "options" parameter', () => {
      const runCommandOptions = {
        test: ':+1:',
      };

      commandsManager.registerCommand('VIEWER', 'TestCommand', command);
      commandsManager.runCommand('TestCommand', runCommandOptions, 'VIEWER');

      expect(command.commandFn.mock.calls.length).toBe(1);
      expect(command.commandFn.mock.calls[0][0].test).toEqual(runCommandOptions.test);
    });

    it('Returns the result of commandFn', () => {
      commandsManager.registerCommand('VIEWER', 'TestCommand', command);
      const result = commandsManager.runCommand('TestCommand', {}, 'VIEWER');

      expect(command.commandFn.mock.calls.length).toBe(1);
      expect(result).toBe(true);
    });
  });
});
