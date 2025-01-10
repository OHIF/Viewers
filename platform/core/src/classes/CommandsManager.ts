import log from '../log.js';
import { Command, Commands, ComplexCommand } from '../types/Command';

/**
 * The definition of a command
 *
 * @typedef {Object} CommandDefinition
 * @property {Function} commandFn - Command to call
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
  private contexts = {};
  // Has the reverse order in which contexts are created, used for the default ordering
  private contextOrder = new Array<string>();

  constructor(_options = {}) {
    // No-op
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
  createContext(contextName, priority?: number) {
    if (!contextName) {
      return;
    }

    if (this.contexts[contextName]) {
      return this.clearContext(contextName);
    }

    this.contexts[contextName] = {};
    // Add the context name to the start of the list.
    this.contextOrder.splice(0, 0, contextName);
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
   * @param {String} [contextName] - Specific command to look in. Defaults to current activeContexts.
   *                 Also allows an array of contexts to look in.
   */
  getCommand = (commandName: string, contextName: string | string[] = this.contextOrder) => {
    const contexts = [];

    if (Array.isArray(contextName)) {
      contexts.push(...contextName.map(name => this.getContext(name)).filter(it => !!it));
    } else if (contextName) {
      const context = this.getContext(contextName);
      if (context) {
        contexts.push(context);
      }
    }

    return contexts.find(context => !!context[commandName])?.[commandName];
  };

  /**
   *
   * @method
   * @param {String} commandName
   * @param {Object} [options={}] - Extra options to pass the command. Like a mousedown event
   * @param {String} [contextName]
   */
  public runCommand(commandName: string, options = {}, contextName?: string | string[]) {
    const definition = this.getCommand(commandName, contextName);
    if (!definition) {
      log.warn(`Command "${commandName}" not found in current context`);
      return;
    }

    const { commandFn } = definition;
    const commandParams = Object.assign(
      {},
      definition.options, // "Command configuration"
      options // "Time of call" info
    );

    if (typeof commandFn !== 'function') {
      log.warn(`No commandFn was defined for command "${commandName}"`);
      return;
    } else {
      return commandFn(commandParams);
    }
  }

  public static convertCommands(toRun: Command | Commands | Command[] | string) {
    if (typeof toRun === 'string') {
      return [{ commandName: toRun }];
    }
    if ('commandName' in toRun) {
      return [toRun as ComplexCommand];
    }
    if ('commands' in toRun) {
      const commandsInput = (toRun as Commands).commands;
      return this.convertCommands(commandsInput);
    }
    if (Array.isArray(toRun)) {
      return toRun.map(command => CommandsManager.convertCommands(command)[0]);
    }

    return [];
  }

  /**
   * Run one or more commands with specified extra options.
   * Returns the result of the last command run.
   *
   * Example commands to run are:
   * * 'updateMeasurement'
   * * `{commandName: 'displayWhatever'}`
   * * `['updateMeasurement', {commandName: 'displayWhatever'}]`
   * * `{ commands: 'updateMeasurement' }`
   * * `{ commands: ['updateMeasurement', {commandName: 'displayWhatever'}]}`
   *
   * Note how the various styles can be mixed, simplifying the declaration of
   * sets of commands.
   *
   * @param toRun - A specification of one or more commands,
   *  typically an object of { commandName, commandOptions, context }
   * or an array of such objects. It can also be a single commandName as string
   * if no options are needed.
   * @param options - to include in the commands run beyond
   *   the commandOptions specified in the base.
   */
  public run(
    toRun: Command | Commands | (Command | string)[] | string | undefined,
    options?: Record<string, unknown>
  ): unknown {
    if (!toRun) {
      return;
    }

    const commands: ComplexCommand[] = CommandsManager.convertCommands(toRun);

    if (commands.length === 0) {
      console.log("Command isn't runnable", toRun);
      return;
    }

    // Execute each command in the array
    let result: unknown;
    commands.forEach(command => {
      const { commandName, commandOptions, context } = command;
      if (commandName) {
        result = this.runCommand(
          commandName,
          {
            // Put options first so that repeated child options override correctly
            ...options,
            ...commandOptions,
          },
          context
        );
      } else {
        if (typeof command === 'function') {
          result = command();
        } else {
          console.warn('No command name supplied in', toRun);
        }
      }
    });

    return result;
  }

  /** Like run, but await each command before continuing */
  public async runAsync(
    toRun: Command | Commands | Command[] | string | undefined,
    options?: Record<string, unknown>
  ): unknown {
    if (!toRun) {
      return;
    }

    const commands: ComplexCommand[] = CommandsManager.convertCommands(toRun);

    if (commands.length === 0) {
      console.log("Command isn't runnable", toRun);
      return;
    }

    // Execute each command in the array
    let result: unknown;
    for (const command of commands) {
      const { commandName, commandOptions, context } = command;
      if (commandName) {
        result = await this.runCommand(
          commandName,
          {
            ...commandOptions,
            ...options,
          },
          context
        );
      } else {
        if (typeof command === 'function') {
          result = await command();
        } else {
          console.warn('No command name supplied in', toRun);
        }
      }
    }

    return result;
  }
}

export default CommandsManager;
