---
sidebar_position: 3
sidebar_label: Lifecycle Hooks
---

# Extensions: Lifecycle Hooks

## Overview

Extensions can implement specific lifecycle methods.

- preRegistration
- onModeEnter
- onModeExit

## preRegistration

If an extension defines the `preRegistration` lifecycle hook, it is called
before any modules are registered in the `ExtensionManager`. This hook is an
`async` function that can be used to perform:

- initialize 3rd party libraries
- register event listeners
- add or call services
- add or call commands

The `preRegistration` hook receives an object containing the
`ExtensionManager`'s associated `ServicesManager`, `CommandsManager`, and any
`configuration` that was provided with the extension at time of registration.

Example `preRegistration` implementation that register a new service and make it
available in the app. We will talk more in details for creating a new service
for `OHIF-v3`.

```js
// new service inside new extension
import MyNewService from './MyNewService';

export default function MyNewServiceWithServices(servicesManager) {
  return {
    name: 'MyNewService',
    create: ({ configuration = {} }) => {
      return new MyNewService(servicesManager);
    },
  };
}
```

and

```js
import MyNewService from './MyNewService'

export default {
  id,

  /**
   * @param {object} params
   * @param {object} params.configuration
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   * @returns void
   */
  async preRegistration({ servicesManager, commandsManager, configuration }) {
    console.log('Wiring up important stuff.');

    window.importantStuff = () => {
      console.log(configuration);
    };

    console.log('Important stuff has been wired.');
    window.importantStuff();

    // Registering new services
    servicesManager.registerService(MyNewService(servicesManager));
  },
  },
};
```

## onModeEnter

If an extension defines the `onModeEnter` lifecycle hook, it is called when a
new mode is enters, or a mode's data or datasource is switched.

For instance, in DICOM structured report extension (`dicom-sr`), we are using
`onModeEnter` to re-create the displaySets after a new mode is entered.

_Example `onModeEnter` hook implementation_

```js
export default {
  id: '@ohif/extension-cornerstone-dicom-sr',

  onModeEnter({ servicesManager }) {
    const { DisplaySetService } = servicesManager.services;
    const displaySetCache = DisplaySetService.getDisplaySetCache();

    const srDisplaySets = displaySetCache.filter(
      ds => ds.SOPClassHandlerId === SOPClassHandlerId
    );

    srDisplaySets.forEach(ds => {
      // New mode route, allow SRs to be hydrated again
      ds.isHydrated = false;
    });
  },
};
```

## onModeExit

If an extension defines the `onModeExit` lifecycle hook, it is called when
navigating away from a mode. This hook can be used to clean up data tasks such
as unregistering services, removing annotations that do not need to be
persisted.

_Example `onModeExit` hook implementation_

```js
export default {
  id: 'myExampleExtension',

  onModeExit({ servicesManager, commandsManager }) {
    myCacheService.purge();
  },
};
```
