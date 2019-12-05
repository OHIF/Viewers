# Services

Services are a beefier version of [commands][commands]. They provide a set of
operations often tied to some shared state. Services are particularly well
suited to address [cross-cutting concerns][cross-cutting-concerns].

Each service should be:

- self-contained
- able to fail and/or be removed without breaking the application
- completely interchangeable with another module implementing the same interface

Practical Examples

## Anatomy

A service consists of

- A name
- An interface/contract that defines the service's methods
- A `setServiceImplementation` method
- And an implementation

Interface defined in `@ohif/core`

- create<Name>Service
- name
- setServiceImplementation
- Defines contract for implementation

Create services Register with ServicesManager ServicesManager is provided to
ExtensionsManager

## UI Services

A typical web application will have components and state for common UI like
modals, notifications, dialogs, etc. A UI service makes it possible to leverage
these components from an extension.

We maintain the following UI Services:

- UIDialogService
- UIModalService
- UINotificationService

You can read more about a specific service by selecting it in the above list,
and more about [UI services in general: here](./ui-services.md)

## Parting Words

Services are "concern-specific" code modules that can be consumed across layers.
We try to minimize the coupling they introduce by authoring services that are
able to fail or be removed. Related patterns that may reduce coupling include:

- Pub/Sub
- Commands

<!-- prettier-ignore-start -->

[commands]: #/
[core-services]: https://github.com/OHIF/Viewers/tree/master/platform/core/src/services
[services-manager]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/ServicesManager.js
[cross-cutting-concerns]: https://en.wikipedia.org/wiki/Cross-cutting_concern

<!-- prettier-ignore-end -->
