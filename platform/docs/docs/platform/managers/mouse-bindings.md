---
sidebar_position: 6
sidebar_label: Mouse Bindings Manager
title: Mouse Bindings Manager
summary: Documentation for the MouseBindingsManager class which manages mouse binding action definitions and persisted user assignments for mode-specific mouse interactions such as modifier-driven actions.
---

# Mouse Bindings Manager

## Overview

`MouseBindingsManager` is the runtime owner for user-editable mouse binding actions.

Today it is used for modifier-based actions such as Crosshairs jump-on-click. The API is
binding-oriented rather than modifier-oriented so it can grow into broader mouse input models
later, such as button-to-action assignment or keyboard-plus-mouse gesture bindings.

Unlike hotkeys, mouse binding actions are not read from `CustomizationService`. Modes register
their available actions during `onModeEnter`, and the preferences UI reads them from the manager.

## Instantiation

`MouseBindingsManager` is instantiated in `appInit` alongside the other managers.

```js
const commandsManager = new CommandsManager(commandsManagerConfig);
const servicesManager = new ServicesManager(commandsManager);
const hotkeysManager = new HotkeysManager(commandsManager, servicesManager);
const mouseBindingsManager = new MouseBindingsManager();

const extensionManager = new ExtensionManager({
  commandsManager,
  servicesManager,
  hotkeysManager,
  mouseBindingsManager,
  appConfig,
});
```

## Mouse Bindings Manager API

- `setActionDefinitions`: Register the action definitions available for the current mode.
- `getActionDefinitions`: Return the registered action definitions for the current mode.
- `getDefaultBindings`: Return the default persisted binding map derived from the registered definitions.
- `getBindings`: Read the current saved binding assignments.
- `setBindings`: Persist a new set of binding assignments and return the normalized result.
- `applyBindings`: Apply the current or provided assignments by calling each action definition's `onChange`.
- `destroy`: Clear the registered action definitions for mode teardown.

## Action Definition Shape

The current action definition shape is modifier-action based:

```ts
type MouseModifierActionDefinition = {
  id: string;
  label: string;
  defaultModifier?: 'ctrl' | 'shift' | 'alt' | 'meta';
  onChange?: (modifierKey?: 'ctrl' | 'shift' | 'alt' | 'meta') => void;
};
```

The manager stores these as generic action definitions even though the persisted bindings are
currently modifier assignments.

## Mode Usage

Modes should register their mouse binding actions explicitly during `onModeEnter`.

```ts
function registerCrosshairsMouseModifierActions({
  mouseBindingsManager,
  commandsManager,
}: withAppTypes) {
  const actions = [
    {
      id: 'crosshairsJump',
      label: 'Jump Crosshairs',
      defaultModifier: 'ctrl',
      onChange: modifierKey => {
        commandsManager.runCommand('setCrosshairsJumpModifier', {
          toolGroupId: 'mpr',
          modifierKey,
        });
      },
    },
  ];

  mouseBindingsManager.setActionDefinitions(actions);
  mouseBindingsManager.applyBindings();
}
```

This keeps mouse binding availability mode-specific and prevents unrelated modes from showing or
applying bindings they do not own.

## Preferences Integration

The default user preferences modal reads action definitions from `mouseBindingsManager`, allows the
user to assign actions to supported modifier slots, persists those assignments, and reapplies them
on save.

At the moment the preferences UI is:

- modifier -> action

The manager name stays more general than that because the implementation can later evolve toward:

- mouse button -> action
- modifier + button -> action
- keyboard key + mouse gesture -> action
