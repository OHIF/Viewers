---
sidebar_position: 2
sidebar_label: Commands
---
# Module: Commands


## Overview
`CommandsModule` includes list of arbitrary functions. These may activate tools, communicate with a server, open a modal, etc.
The significant difference between `OHIF-v3` and `OHIF-v2` is that in `v3` a `mode` defines
its toolbar, and which commands each tool call is inside in its toolDefinition

An extension can register a Commands Module by defining a `getCommandsModule`
method. The Commands Module allows us to register one or more commands scoped to
specific [contexts](./../index.md#contexts). Commands have several unique
characteristics that make them tremendously powerful:

- Multiple implementations for the same command can be defined
- Only the correct command's implementation will be run, dependent on the
  application's "context"
- Commands are used by hotkeys, toolbar buttons and render settings

Here is a simple example commands module:

```js
const getCommandsModule = () => ({
  definitions: {
    exampleActionDef: {
      commandFn: ({ param1 }) => {
        console.log(`param1's value is: ${param1}`);
      },
      // storeContexts: ['viewports'],
      options: { param1: 'param1' },
      context: 'VIEWER', // optional
    },
  },
  defaultContext: 'ACTIVE_VIEWPORT::DICOMSR',
});
```


Each definition returned by the Commands Module is registered to the
`ExtensionManager`'s `CommandsManager`.

> `storeContexts` has been removed in `OHIF-v3` and now modules have access to all commands and services. This change enables support for user-registered services.

## Command Definitions

The command definition consists of a named command (`exampleActionDef` below) and a
`commandFn`. The command name is used to call the command, and the `commandFn`
is the "command" that is actioned.

```js
exampleActionDef: {
	commandFn: ({ param1, options }) => { },
	options: { param1: 'measurement' },
	context: 'DEFAULT',
}
```

| Property        | Type               | Description                                                                                                                             |
| --------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `commandFn`     | func               | The function to call when command is run. Receives `options` and `storeContexts`.                                                       |
| `options`       | object             | (optional) Arguments to pass at the time of calling to the `commandFn`                                                                  |
| `context`       | string[] or string | (optional) Overrides the `defaultContext`. Let's us know if command is currently "available" to be run.                                 |

## Command Behavior



**If there are multiple valid commands for the application's active contexts**

- What happens: all commands are run
- When to use: A `clearData` command that cleans up state for multiple
  extensions

**If no commands are valid for the application's active contexts**

- What happens: a warning is printed to the console
- When to use: a `hotkey` (like "invert") that doesn't make sense for the
  current viewport (PDF or HTML)

## `CommandsManager` Public API

If you would like to run a command in the consuming app or an extension, you can
use `CommandsManager.runCommand(commandName, options = {}, contextName)`


```js
// Returns all commands for a given context
commandsManager.getContext('string');

// Run a command, it will run all the `speak` commands in all contexts
commandsManager.runCommand('speak', { command: 'hello' });

// Run command, from Default context
commandsManager.runCommand('speak', { command: 'hello' }, ['DEFAULT']);
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
changes to how contexts work, please don't hesitate to create a new GitHub
issue.

[Some additional information on Contexts can be found here.](./../index.md#contexts)
