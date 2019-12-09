# Module: Commands

- [Overview](#overview)
- [Command Definitions](#command-definitions)
- [Commands Manager](#commands-manager)
  - [Instantiating](#instatiating)
  - [Public API](#public-api)
  - [Contexts](#contexts)

## Overview

An extension can register a Commands Module by defining a `getCommandsModule`
method. The Commands Module allows us to register one or more commands scoped to
specific [contexts](./../index.md#contexts). Commands have several unique
characteristics that make them tremendously powerful:

- Multiple implementations for the same command can be defined
- Only the correct command's implementation will be run, dependent on the
  application's "context"
- Commands can be called from extensions, modules, and the consuming application

Here is a simple example commands module:

```js
export default {
  id: 'example-commands-module',

  /**
   * @param {object} params
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   */
  getCommandsModule({ servicesManager, commandsManager }) {
    return {
      definitions: {
        sayHello: {
          commandFn: ({ words }) => {
            console.log(words);
          },
          options: { words: 'Hello!' },
        },
      },
      defaultContext: 'VIEWER',
    };
  },
};
```

Each definition returned by the Commands Module is registered to the
`ExtensionManager`'s `CommandsManager`.

## Command Definitions

The command definition consists of a named command (`myCommandName` below) and a
`commandFn`. The command name is used to call the command, and the `commandFn`
is the "command" that is actioned.

```js
myCommandName: {
	commandFn: ({ viewports, other, options }) => { },
	storeContexts: ['viewports'],
	options: { words: 'Just kidding! Goodbye!' },
	context: 'ACTIVE_VIEWPORT::CORNERSTONE',
}
```

| Property        | Type               | Description                                                                                                                             |
| --------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `commandFn`     | func               | The function to call when command is run. Receives `options` and `storeContexts`.                                                       |
| `storeContexts` | string[]           | (optional) Expected state objects to be passed in as props. Located using `getAppState` fn defined at `CommandsManager`'s instatiation. |
| `options`       | object             | (optional) Arguments to pass at the time of calling to the `commandFn`                                                                  |
| `context`       | string[] or string | (optional) Overrides the `defaultContext`. Let's us know if command is currently "available" to be run.                                 |

## Command Behavior

**I have many similar commands. How can I share their `commandFn` and make it
reusable?**

This is where `storeContexts` and `options` come in. We use these in our
`setToolActive` command. `storeContexts` helps us identify our `activeViewport`,
and `options` allow us to pass in the name of a tool we would like to set as
active.

**If there are multiple valid commands for the application's active contexts**

- What happens: all commands are run
- When to use: A `clearData` command that cleans up state for multiple
  extensions

**If no commands are valid for the application's active contexts**

- What happens: a warning is printed to the console
- When to use: a `hotkey` (like "invert") that doesn't make sense for the
  current viewport (PDF or HTML)

## `CommandsManager`

The `CommandsManager` is a class defined in the `@ohif/core` project. A single
instance of it should be defined in the consuming application, and it should be
used when constructing the `ExtensionManager`.

### Instantiating

When we instantiate the `CommandsManager`, we need to pass it two methods:

- `getAppState` - Should return the application's state when called
- `getActiveContexts` - Should return the application's active contexts when
  called

These methods are used internally to help determine which commands are currently
valid, and how to provide them with any state they may need at the time they are
called.

```js
const commandsManager = new CommandsManager({
  getAppState,
  getActiveContexts,
});
```

### Public API

If you would like to run a command in the consuming app or an extension, you can
use one of the following methods:

```js
// Returns all commands for a given context
commandsManager.getContext('string');

// Attempts to run a command
commandsManager.runCommand('speak', { command: 'hello' });

// Run command, but override the active contexts
commandsManager.runCommand('speak', { command: 'hello' }, ['VIEWER']);
```

The `ExtensionManager` handles registering commands and creating contexts, so
most consumer's won't need these methods. If you find yourself using these, ask
yourself "why can't I register these commands via an extension?"

```js
// Used by the `ExtensionManager` to register new commands
commandsManager.registerCommand('context', 'name', commandDefinition);

// Creates a new context; clears the context if it already exists
commandsManager.createContext('string');
```

### Contexts

It is up to the consuming application to define what contexts are possible, and
which ones are currently active. As extensions depend heavily on these, we will
likely publish guidance around creating contexts, and ways to override extension
defined contexts in the near future. If you would like to discuss potential
changes to how contexts work, please don't hesistate to createa new GitHub
issue.

[Some additional information on Contexts can be found here.](./../index.md#contexts)
