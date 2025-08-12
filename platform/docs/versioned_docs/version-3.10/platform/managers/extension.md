---
sidebar_position: 2
sidebar_label: Extension Manager
---

# Extension Manager

## Overview

The `ExtensionManager` is a class made available to us via the `@ohif/core`
project (platform/core). Our application instantiates a single instance of it,
and provides a `ServicesManager` and `CommandsManager` along with the
application's configuration through the appConfig key (optional).

```js
const commandsManager = new CommandsManager();
const servicesManager = new ServicesManager();
const extensionManager = new ExtensionManager({
  commandsManager,
  servicesManager,
  appConfig,
});
```
## Events
The following events get published by the `ExtensionManager`:

| Event                        | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| ACTIVE_DATA_SOURCE_CHANGED   | Fired when the active data source is changed - either replaced with an entirely different one or the existing active data source gets its definition changed via `updateDataSourceConfiguration`. |

## API
The `ExtensionManager` only has the following public API:

- `setActiveDataSource` - Sets the active data source for the application
- `getDataSources` - Returns the registered data sources
- `getActiveDataSource` - Returns the currently active data source
- `getModuleEntry` - Returns the module entry by the give id.
- `addDataSource` - Dynamically adds a data source and optionally sets it as the active data source
- `updateDataSourceConfiguration` - Updates the configuration of a specified data source (name).
- `getDataSourceDef` - Gets the data source definition for a particular data source name.

## Accessing Modules

We use `getModuleEntry` in our `ViewerLayout` logic to find the panels based on
the provided IDs in the mode's configuration.

For instance:
`extensionManager.getModuleEntry("@ohif/extension-measurement-tracking.panelModule.seriesList")`
accesses the `seriesList` panel from `panelModule` of the
`@ohif/extension-measurement-tracking` extension.

```js
const getPanelData = id => {
  const entry = extensionManager.getModuleEntry(id);
  const content = entry.component;

  return {
    iconName: entry.iconName,
    iconLabel: entry.iconLabel,
    label: entry.label,
    name: entry.name,
    content,
  };
};
```
