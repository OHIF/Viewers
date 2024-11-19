---
sidebar_position: 4
sidebar_label: Commands Manager
---
# Commands Manager

## Overview


The `CommandsManager` is a class defined in the `@ohif/core` project. The Commands Manager tracks named commands (or functions) that are scoped to
a context. When we attempt to run a command with a given name, we look for it
in our active contexts. If found, we run the command, passing in any application
or call specific data specified in the command's definition.

> Note: A single instance of `CommandsManager` should be defined in the consuming application, and it is used when constructing the `ExtensionManager`.

A `simplified skeleton` of the `CommandsManager` is shown below:

```js
export class CommandsManager {
  constructor({ getActiveContexts } = {}) {
    this.contexts = {};
    this._getActiveContexts = getActiveContexts;
  }

  getContext(contextName) {
    const context = this.contexts[contextName];
    return context;
  }

  /**...**/

  createContext(contextName) {
	  /** ... **/
    this.contexts[contextName] = {};
  }


  registerCommand(contextName, commandName, definition) {
   	/**...**/
    const context = this.getContext(contextName);
    /**...**/
    context[commandName] = definition;
  }

  runCommand(commandName, options = {}, contextName) {
    const definition = this.getCommand(commandName, contextName);
    /**...**/
    const { commandFn } = definition;
    const commandParams = Object.assign(
      {},
      definition.options, // "Command configuration"
      options // "Time of call" info
    );
    /**...**/
    return commandFn(commandParams);
  }
  /**...**/
}
```




### Instantiating

When we instantiate the `CommandsManager`, we are passing two methods:

- `getAppState` - Should return the application's state when called (Not implemented in `v3`)
- `getActiveContexts` - Should return the application's active contexts when
  called

These methods are used internally to help determine which commands are currently
valid, and how to provide them with any state they may need at the time they are
called.

```js title="platform/app/src/appInit.js"
const commandsManagerConfig = {
  getAppState: () => {},
  /** Used by commands to determine active context */
  getActiveContexts: () => [
    'VIEWER',
    'DEFAULT',
    'ACTIVE_VIEWPORT::CORNERSTONE',
  ],
};

const commandsManager = new CommandsManager(commandsManagerConfig);
```


## Commands/Context Registration
The `ExtensionManager` handles registering commands and creating contexts, so you don't need to register all your commands manually. Simply, create a `commandsModule` in your extension, and it will get automatically registered in the `context` provided.

A *simplified version* of this registration is shown below to give an idea about the process.


```js
export default class ExtensionManager {
  constructor({ commandsManager }) {
    this._commandsManager = commandsManager
  }
  /** ... **/
  registerExtension = (extension, configuration = {}, dataSources = []) => {
    let extensionId = extension.id
    /** ... **/

    // Register Modules provided by the extension
    moduleTypeNames.forEach((moduleType) => {
      const extensionModule = this._getExtensionModule(
        moduleType,
        extension,
        extensionId,
        configuration
      )

      if (moduleType === 'commandsModule') {
        this._initCommandsModule(extensionModule)
      }
      /** registering other modules **/
    })
  }

  _initCommandsModule = (extensionModule) => {
    let { definitions, defaultContext } = extensionModule
    defaultContext = defaultContext || 'VIEWER'

    if (!this._commandsManager.getContext(defaultContext)) {
      this._commandsManager.createContext(defaultContext)
    }

    Object.keys(definitions).forEach((commandName) => {
      const commandDefinition = definitions[commandName]
      const commandHasContextThatDoesNotExist =
        commandDefinition.context &&
        !this._commandsManager.getContext(commandDefinition.context)

      if (commandHasContextThatDoesNotExist) {
        this._commandsManager.createContext(commandDefinition.context)
      }

      this._commandsManager.registerCommand(
        commandDefinition.context || defaultContext,
        commandName,
        commandDefinition
      )
    })
  }
}

```


If you find yourself in a situation where you want to register a command/context manually, ask
yourself "why can't I register these commands via an extension?", but if you insist, you can use the `CommandsManager` API to do so:

```js
// Command Registration
commandsManager.registerCommand('context', 'name', commandDefinition);

// Context Creation
commandsManager.createContext('string');
```

## `CommandsManager` Public API

If you would like to run a command in the consuming app or an extension, you can
use `runCommand(commandName, options = {}, contextName)`.


```js
// Run a command, it will run all the `speak` commands in all contexts
commandsManager.runCommand('speak', { command: 'hello' });

// Run command, from Default context
commandsManager.runCommand('speak', { command: 'hello' }, ['DEFAULT']);

// Returns all commands for a given context
commandsManager.getContext('string');
```
