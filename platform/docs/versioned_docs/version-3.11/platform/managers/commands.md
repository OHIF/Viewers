---
sidebar_position: 4
sidebar_label: Commands Manager
title: Commands Manager
summary: Documentation for the CommandsManager class which tracks named functions scoped to specific contexts, allowing OHIF to execute commands with appropriate context prioritization across the application.
---
# Commands Manager

## Overview


The `CommandsManager` is a class defined in the `@ohif/core` project.
The Commands Manager tracks named commands (or functions) that are scoped to
a context. When we attempt to run a command with a given name, we look for it
in our active contexts, in the order specified.
If found, we run the command, passing in any application
or call specific data specified in the command's definition.

The order specified is the REVERSE of the order the modules are registered in
for the mode dependency.  That is, the last module registered has the highest priority
and will be searched first for commands.  This has nothing to do with when the
command itself is registered, although registrations for the same command in different
modules in the same context will also use last registration wins.

> Note: A single instance of `CommandsManager` should be defined in the consuming
application, and it is used when constructing the `ExtensionManager`.

A `simplified skeleton` of the `CommandsManager` is shown below:

```js
export class CommandsManager {
  contexts = {};
  contextOrder = [];

  constructor(_ignoredConfig) {}

  getContext(contextName) {
    const context = this.contexts[contextName];
    return context;
  }

  /**...**/

  createContext(contextName) {
	  /** ... **/
    this.contexts[contextName] = {};
    this.contextOrder.push at beginning(contextName)
  }


  registerCommand(contextName, commandName, definition) {
   	/**...**/
    const context = this.getContext(contextName);
    /**...**/
    context[commandName] = definition;
  }

  getCommand(commandName, contextName) {
    const useContext = contextName || first context having commandName in contextOrder
    return useContext[commandName];
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

No methods or configuration is used within the construction.


## Commands/Context Registration
The `ExtensionManager` handles registering commands and creating contexts, so you
don't need to register all your commands manually. Simply, create a `commandsModule`
in your extension, and it will get automatically registered in the `context` provided.

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
commandsManager.runCommand('speak', { command: 'hello' }, 'DEFAULT');

// Returns all commands for a given context
commandsManager.getContext('string');
```
