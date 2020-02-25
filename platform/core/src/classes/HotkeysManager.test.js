import CommandsManager from './CommandsManager.js';
import HotkeysManager from './HotkeysManager.js';
import hotkeys from './../utils/hotkeys';
import log from './../log.js';

jest.mock('./CommandsManager.js');
jest.mock('./../utils/hotkeys');
jest.mock('./../log.js');

describe('HotkeysManager', () => {
  let hotkeysManager, commandsManager;

  beforeEach(() => {
    commandsManager = new CommandsManager();
    hotkeysManager = new HotkeysManager(commandsManager);
    CommandsManager.mockClear();
    hotkeys.mockClear();
    log.warn.mockClear();
    jest.clearAllMocks();
  });

  it('has expected properties', () => {
    const allProperties = Object.keys(hotkeysManager);
    const expectedProprties = [
      'hotkeyDefinitions',
      'hotkeyDefaults',
      'isEnabled',
    ];

    const containsAllExpectedProperties = expectedProprties.every(expected =>
      allProperties.includes(expected)
    );

    expect(containsAllExpectedProperties).toBe(true);
  });

  it('logs a warning if instantiated without a commandsManager', () => {
    new HotkeysManager();

    expect(log.warn.mock.calls.length).toBe(1);
    expect(log.warn.mock.calls[0][0]).toEqual(
      'HotkeysManager instantiated without a commandsManager. Hotkeys will be unable to find and run commands.'
    );
  });

  describe('disable()', () => {
    beforeEach(() => hotkeys.pause.mockClear());

    it('sets isEnabled property to false', () => {
      hotkeysManager.disable();

      expect(hotkeysManager.isEnabled).toBe(false);
    });

    it('calls hotkeys.pause()', () => {
      hotkeysManager.disable();

      expect(hotkeys.pause.mock.calls.length).toBe(1);
    });
  });

  describe('enable()', () => {
    beforeEach(() => {
      hotkeys.unpause = jest.fn();
      hotkeys.unpause.mockClear();
    });

    it('sets isEnabled property to true', () => {
      hotkeysManager.disable();
      hotkeysManager.enable();

      expect(hotkeysManager.isEnabled).toBe(true);
    });

    it('calls hotkeys.unpause()', () => {
      hotkeysManager.enable();

      expect(hotkeys.unpause.mock.calls.length).toBe(1);
    });
  });

  describe('setHotkeys()', () => {
    it('calls registerHotkeys for each hotkeyDefinition', () => {
      const hotkeyDefinitions = [
        { commandName: 'dance', label: 'dance dance', keys: '+' },
        { commandName: 'celebrate', label: 'celebrate everything', keys: 'q' },
      ];

      hotkeysManager.registerHotkeys = jest.fn();
      hotkeysManager.setHotkeys(hotkeyDefinitions);

      const numberOfCalls = hotkeysManager.registerHotkeys.mock.calls.length;
      const firstCallArgs = hotkeysManager.registerHotkeys.mock.calls[0][0];
      const secondCallArgs = hotkeysManager.registerHotkeys.mock.calls[1][0];

      expect(numberOfCalls).toBe(2);
      expect(firstCallArgs).toEqual(hotkeyDefinitions[0]);
      expect(secondCallArgs).toEqual(hotkeyDefinitions[1]);
    });
    it('does not set this.hotkeyDefaults when calling setHotKeys', () => {
      const hotkeyDefinitions = [{ commandName: 'dance', keys: '+' }];

      hotkeysManager.setHotkeys(hotkeyDefinitions);

      expect(hotkeysManager.hotkeyDefaults).toEqual([]);
    });
  });

  describe('setDefaultHotKeys()', () => {
    it('it sets default hotkeys', () => {
      const hotkeyDefinitions = [{ commandName: 'dance', keys: '+' }];

      hotkeysManager.setDefaultHotKeys(hotkeyDefinitions);

      expect(hotkeysManager.hotkeyDefaults).toEqual(hotkeyDefinitions);
    });
  });

  describe('registerHotkeys()', () => {
    it('logs a warning and returns undefined if a commandName is not provided', () => {
      const definition = { commandName: undefined, keys: '+' };

      const result = hotkeysManager.registerHotkeys(definition);

      expect(result).toBe(undefined);
      expect(log.warn.mock.calls.length).toBe(1);
    });
    it('updates hotkeyDefinitions property with registered keys', () => {
      const definition = { commandName: 'dance', label: 'hello', keys: '+' };
      const expectedHotkeyDefinition = { label: 'hello', keys: '+' };

      hotkeysManager.registerHotkeys(definition);

      const numOfHotkeyDefinitions = Object.keys(
        hotkeysManager.hotkeyDefinitions
      ).length;
      const hotkeyDefinitionForRegisteredCommand =
        hotkeysManager.hotkeyDefinitions[definition.commandName];

      expect(numOfHotkeyDefinitions).toBe(1);
      expect(hotkeyDefinitionForRegisteredCommand).toEqual(
        expectedHotkeyDefinition
      );
    });
    it('calls hotkeys.bind for the group of keys', () => {
      const definition = { commandName: 'dance', keys: ['shift', 'e'] };

      hotkeysManager.registerHotkeys(definition);

      expect(hotkeys.bind.mock.calls.length).toBe(1);
      expect(hotkeys.bind.mock.calls[0][0]).toBe('shift+e');
    });
    it('calls hotkeys.unbind if commandName was previously registered, for each previously registered set of keys', () => {
      const firstDefinition = {
        commandName: 'dance',
        keys: ['alt', 'e'],
      };
      const secondDefinition = { commandName: 'dance', keys: 'a' };

      // First call
      hotkeysManager.registerHotkeys(firstDefinition);
      // Second call
      hotkeysManager.registerHotkeys(secondDefinition);

      expect(hotkeys.unbind.mock.calls.length).toBe(1);
      expect(hotkeys.unbind.mock.calls[0][0]).toBe('alt+e');
    });
  });

  describe('restoreDefaults()', () => {
    it('calls setHotkeys with hotkey defaults', () => {
      hotkeysManager.setHotkeys = jest.fn();

      hotkeysManager.restoreDefaultBindings();

      expect(hotkeysManager.setHotkeys.mock.calls[0][0]).toEqual(
        hotkeysManager.hotkeyDefaults
      );
    });
  });

  describe('destroy()', () => {
    it('clears default and definition properties', () => {
      hotkeysManager.hotkeyDefaults = ['hotdog', 'jeremy', 'qasar'];
      hotkeysManager.hotkeyDefinitions = {
        hello: 'world',
      };

      hotkeysManager.destroy();

      expect(hotkeysManager.hotkeyDefaults).toEqual([]);
      expect(hotkeysManager.hotkeyDefinitions).toEqual({});
    });
    it('resets all hotkey bindings', () => {
      hotkeysManager.destroy();

      expect(hotkeys.reset.mock.calls.length).toEqual(1);
    });
  });
});
