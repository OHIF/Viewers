---
sidebar_position: 3
sidebar_label: Service Manager
title: Service Manager
summary: Documentation for the ServicesManager class which provides central registration and access to application services, with details on built-in services, service architecture, lifecycle management, and implementation of custom services.
---

# Services Manager

## Overview

Services manager is the single point of service registration. Each service needs
to implement a `create` method which gets called inside `ServicesManager` to
instantiate the service. In the app, you can get access to a registered service
via the `services` property of the `ServicesManager`.

## Skeleton

_Simplified_ skeleton of `ServicesManager` is shown below. There are two public
methods:

- `registerService`: registering a new service with/without a configuration
- `registerServices`: registering batch of services

```js
export default class ServicesManager {
  constructor(commandsManager) {
    this._commandsManager = commandsManager;
    this.services = {};
    this.registeredServiceNames = [];
  }

  registerService(service, configuration = {}) {
    /** validation checks **/
    this.services[service.name] = service.create({
      configuration,
      commandsManager: this._commandsManager,
    });

    /* Track service registration */
    this.registeredServiceNames.push(service.name);
  }

  registerServices(services) {
    /** ... **/
  }
}
```

## Default Registered Services

By default, `OHIF-v3` registers the following services in the `appInit`.

```js title="platform/app/src/appInit.js"
servicesManager.registerServices([
  CustomizationService,
  UINotificationService,
  UIModalService,
  UIDialogService,
  UIViewportDialogService,
  MeasurementService,
  DisplaySetService,
  ToolBarService,
  ViewportGridService,
  HangingProtocolService,
  CineService,
]);
```

## Service Architecture

If you take a look at the folder of each service implementation above, you will
find out that services need to be exported as an object with `name` and `create`
method.

For instance, `ToolBarService` is exported as:

```js title="platform/core/src/services/ToolBarService/index.js"
import ToolBarService from './ToolBarService';

export default {
  name: 'ToolBarService',
  create: ({ configuration = {}, commandsManager }) => {
    return new ToolBarService(commandsManager);
  },
};
```

and the implementation of `ToolBarService` lies in the same folder at
`./ToolbarSerivce.js`.

> Note: The create method is critical for any custom service that you write and
> want to add to the list of services

> Note: For typescript definitions, the service type should be exported
> as part of the Types export on the module.  This is recommended going forward
> and existing services will be migrated.  As well, the capitalization of the
> name should be lower camel case, with the type being upper camel case.  In
> the above example, the service instance should be `toolBarService` with the
> class being `ToolBarService`.

## Accessing Services

Throughout the app you can use `services` property of the service manager to
access the desired service.

For instance in the `PanelMeasurementTableTracking` which is the right panel in
the `longitudinal` mode, we have the _simplified code below_ for downloading the
drawn measurements.

```js
function PanelMeasurementTableTracking({ servicesManager }) {
  const { MeasurementService } = servicesManager.services;
  /** ... **/

  async function exportReport() {
    const measurements = MeasurementService.getMeasurements();
    /** ... **/
    downloadCSVReport(measurements, MeasurementService);
  }

  /** ... **/
  return <> /** ... **/ </>;
}
```

## Registering Custom Services

You might need to write you own custom service in an extension.
`preRegistration` hook inside your extension is the place for registering your
custom service.

```js title="extensions/customExtension/src/index.js"
import WrappedBackEndService from './services/backEndService';

export default {
  // ID of the extension
  id: 'myExtension',
  preRegistration({ servicesManager }) {
    servicesManager.registerService(WrappedBackEndService(servicesManager));
  },
};
```

and the logic for your service shall be

```js title="extensions/customExtension/src/services/backEndService/index.js"
// Canonical name of upper camel case BackEndService for the class
import BackEndService from './BackEndService';

export default function WrappedBackEndService(servicesManager) {
  return {
    // Note the canonical name of lower camel case backEndService
    name: 'backEndService',
    create: ({ configuration = {} }) => {
      return new BackEndService(servicesManager);
    },
  };
}
```

with implementation of

```ts
export default class BackEndService {
  constructor(servicesManager) {
    this.servicesManager = servicesManager;
  }

  putAnnotations() {
    return post(/*...*/);
  }
}
```

with a registration of

```ts title="types/index.ts"
import BackEndService from "../services/BackEndService/BackEndService";

export { BackEndService };
```

# Service Mode Lifecycle
Services may implement initialization and cleanup for mode specific data.
In order to prevent defects where there are differences between initial
and subsequent displays of a study, the contract of the service is that the
state the service is in on mode entry shall be the same whether the mode was
entered or was exited and entered again.

To implement storage/recovery of state, the mode must store the data on
exiting the mode, and restore the data in it's onModeEnter.  For example,
the mode may decide to preserve measurement data in the onModeExit, and
to restore it in the onModeEnter.  This does not violate the contract since
it is the mode's decision to apply the stored state, and to cache it.

## onModeEnter
A service may implement an onModeEnter call to initialize the service to
be ready for entering a mode.
This is called before the mode `onModeEnter` is called.

## onModeExit
When entering a mode, the service contract states that the service needs to
be in the same state whether it is a fresh load or has previously entered the mode.
The onModeExit allows a service to clean itself up after the mode 'onModeExit'
has stored any persistent data.
