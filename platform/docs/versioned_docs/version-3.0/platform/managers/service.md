---
sidebar_position: 3
sidebar_label: Service Manager
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

```js title="platform/viewer/src/appInit.js"
servicesManager.registerServices([
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

> Note, the create method is critical for any custom service that you write and
> want to add to the list of services

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
import backEndService from './backEndService';

export default function WrappedBackEndService(serviceManager) {
  return {
    name: 'myService',
    create: ({ configuration = {} }) => {
      return new backEndService(serviceManager);
    },
  };
}
```

with implementation of

```js
export default class backEndService {
  constructor(serviceManager) {
    this.serviceManager = serviceManager;
  }

  putAnnotations() {
    return post(/*...*/);
  }
}
```
