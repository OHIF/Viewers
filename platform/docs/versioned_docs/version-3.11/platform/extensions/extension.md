---
sidebar_position: 4
sidebar_label: Extension Manager
title: OHIF Extension Manager
summary: Documentation for OHIF's ExtensionManager class, which manages the registration and access of extensions, providing methods to retrieve module entries, access data sources, and handle extension configurations.
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

The `ExtensionManager` only has a few public members:

- `setActiveDataSource` - Sets the active data source for the application
- `getDataSources` - Returns the registered data sources
- `getActiveDataSource` - Returns the currently active data source
- `getModuleEntry` - Returns the module entry by the give id.

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
