import log from '../log.js';

/**
 * The definition of a command
 *
 * @typedef {Object} CommandDefinition
 * @property {Function} commandFn - Command to call
 * @property {Array} storeContexts - Array of string of modules required from store
 * @property {Object} options - Object of params to pass action
 */

/**
 * The Commands Manager tracks named commands (or functions) that are scoped to
 * a context. When we attempt to run a command with a given name, we look for it
 * in our active contexts. If found, we run the command, passing in any application
 * or call specific data specified in the command's definition.
 *
 * NOTE: A more robust version of the CommandsManager lives in v1. If you're looking
 * to extend this class, please check it's source before adding new methods.
 */
export class CommandsManager {
  constructor({ getAppState, getActiveContexts } = {}) {
    this.contexts = {};

    if (!getAppState || !getActiveContexts) {
      log.warn(
        'CommandsManager was instantiated without getAppState() or getActiveContexts()'
      );
    }

    this._getAppState = getAppState;
    this._getActiveContexts = getActiveContexts;
  }

  /**
   * Allows us to create commands "per context". An example would be the "Cornerstone"
   * context having a `SaveImage` command, and the "VTK" context having a `SaveImage`
   * command. The distinction of a context allows us to call the command in either
   * context, and have faith that the correct command will be run.
   *
   * @method
   * @param {string} contextName - Namespace for commands
   * @returns {undefined}
   */
  createContext(contextName) {
    if (!contextName) {
      return;
    }

    if (this.contexts[contextName]) {
      return this.clearContext(contextName);
    }

    this.contexts[contextName] = {};
  }

  /**
   * Returns all command definitions for a given context
   *
   * @method
   * @param {string} contextName - Namespace for commands
   * @returns {Object} - the matched context
   */
  getContext(contextName) {
    const context = this.contexts[contextName];

    if (!context) {
      return;
    }

    return context;
  }

  /**
   * Clears all registered commands for a given context.
   *
   * @param {string} contextName - Namespace for commands
   * @returns {undefined}
   */
  clearContext(contextName) {
    if (!contextName) {
      return;
    }

    this.contexts[contextName] = {};
  }

  /**
   * Register a new command with the command manager. Scoped to a context, and
   * with a definition to assist command callers w/ providing the necessary params
   *
   * @method
   * @param {string} contextName - Namespace for command; often scoped to the extension that added it
   * @param {string} commandName - Unique name identifying the command
   * @param {CommandDefinition} definition - {@link CommandDefinition}
   */
  registerCommand(contextName, commandName, definition) {
    if (typeof definition !== 'object') {
      return;
    }

    const context = this.getContext(contextName);
    if (!context) {
      return;
    }

    context[commandName] = definition;
  }

  /**
   * Finds a command with the provided name if it exists in the specified context,
   * or a currently active context.
   *
   * @method
   * @param {String} commandName - Command to find
   * @param {String} [contextName] - Specific command to look in. Defaults to current activeContexts
   */
  getCommand(commandName, contextName) {
    let contexts = [];

    if (contextName) {
      const context = this.getContext(contextName);
      if (context) {
        contexts.push(context);
      }
    } else {
      const activeContexts = this._getActiveContexts();
      activeContexts.forEach(activeContext => {
        const context = this.getContext(activeContext);
        if (context) {
          contexts.push(context);
        }
      });
    }

    if (contexts.length === 0) {
      return;
    }

    let foundCommand;
    contexts.forEach(context => {
      if (context[commandName]) {
        foundCommand = context[commandName];
      }
    });

    return foundCommand;
  }

  /**
   *
   * @method
   * @param {String} commandName
   * @param {Object} [options={}] - Extra options to pass the command. Like a mousedown event
   * @param {String} [contextName]
   */
  runCommand(commandName, options = {}, contextName) {
    const definition = this.getCommand(commandName, contextName);
    if (!definition) {
      log.warn(`Command "${commandName}" not found in current context`);
      return;
    }

    const { commandFn, storeContexts = [] } = definition;
    const definitionOptions = definition.options;

    let commandParams = {};
    const appState = this._getAppState();
    storeContexts.forEach(context => {
      commandParams[context] = appState[context];
    });

    commandParams = Object.assign(
      {},
      commandParams, // Required store contexts
      definitionOptions, // "Command configuration"
      options // "Time of call" info
    );

    if (typeof commandFn !== 'function') {
      log.warn(`No commandFn was defined for command "${commandName}"`);
      return;
    } else {
      return commandFn(commandParams);
    }
  }
}

export default CommandsManager;
