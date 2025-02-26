---
sidebar_position: 5
sidebar_label: Hotkeys Manager
---
# Hotkeys Managers

## Overview
`HotkeysManager` handles all the logics for adding, setting and enabling/disabling
the hotkeys.



## Instantiation
`HotkeysManager` is instantiated in the `appInit` similar to the other managers.

```js
const commandsManager = new CommandsManager(commandsManagerConfig);
const servicesManager = new ServicesManager(commandsManager);
const hotkeysManager = new HotkeysManager(commandsManager, servicesManager);
const extensionManager = new ExtensionManager({
  commandsManager,
  servicesManager,
  hotkeysManager,
  appConfig,
});
```




## Hotkeys Manager API

- `setHotkeys`: The most important method in the `HotkeysManager` which binds the keys with commands.
- `setDefaultHotKeys`: set the defaultHotkeys **property**. Note that, this method **does not** bind the provided hotkeys; however, when `restoreDefaultBindings`
is called, the provided defaultHotkeys will get bound.
- `destroy`: reset the HotkeysManager, and remove the set hotkeys and empty out the `defaultHotkeys`



## Structure of a Hotkey Definition
A hotkey definition should have the following properties:

- `commandName`: name of the registered command
- `commandOptions`: extra arguments to the commands
- `keys`: an array defining the key to get bound to the command
- `label`: label to be shown in the hotkeys preference panel
- `isEditable`: whether the key can be edited by the user in the hotkey panel


### Default hotkeysBindings
The default key bindings can be find in `hotkeyBindings.js`

```js
// platform/core/src/defaults/hotkeyBindings.js

export default [
  /**..**/
  {
    commandName: 'setToolActive',
    commandOptions: { toolName: 'Zoom' },
    label: 'Zoom',
    keys: ['z'],
    isEditable: true,
  },

  {
    commandName: 'flipViewportHorizontal',
    label: 'Flip Vertically',
    keys: ['v'],
    isEditable: true,
  },
  /**..**/
]
```


## Behind the Scene
When you `setHotkeys`,  the `commandName` gets registered with the `commandsManager` and
get run after the key is pressed.
