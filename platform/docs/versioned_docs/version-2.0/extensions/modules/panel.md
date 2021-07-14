---
sidebar_position: 2
sidebar_label: Panel
---
# Module: Panel

An extension can register a Panel Module by defining a `getPanelModule` method.
The panel module provides the ability to define `menuOptions` and `components`
that can be used by the consuming application. `components` are React Components
that can be displayed in the consuming application's "Panel" Component.

![Panel Extension](../../assets/img/extensions-panel.gif)

<center><i>A panel extension example</i></center>

The `menuOptions`'s `target` key points to a registered `components`'s `id`. A
`defaultContext` is applied to all `menuOption`s; however, each `menuOption` can
optional provide it's own `context` value.

The `getPanelModule` receives an object containing the `ExtensionManager`'s
associated `ServicesManager` and `CommandsManager`.

```js
import MyComponent from './MyComponent.js';

export default {
  id: 'example-panel-module',

  /**
   * @param {object} params
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   */
  getPanelModule({ servicesManager, commandsManager }) {
    return {
      menuOptions: [
        {
          // A suggested icon
          // Available icons determined by consuming app
          icon: 'list',
          // A suggested label
          label: 'Magic',
          // 'right' or 'left'
          from: 'right',
          // The target component to toggle open/close
          target: 'target-component-id',
          // UI Hint; If the target panel is in a "disabled" state
          isDisabled: studies => {
            return false;
          },
          // Overrides `defaultContext`, if specified
          context: ['ACTIVE_VIEWPORT:MAGIC'],
        },
      ],
      components: [
        {
          id: 'target-component-id',
          component: MyComponent,
        },
      ],
      defaultContext: ['ROUTE:VIEWER'],
    };
  },
};
```
