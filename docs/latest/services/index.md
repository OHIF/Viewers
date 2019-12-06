# Services

- [Overview](#/)
- [Anatomy](#/)
- [UI Services](#/)
- [Parting Words](#/)

## Overview

Services are a beefier version of [commands][commands]. They provide a set of
operations, often tied to some shared state, and are made available to
extensions via the `ServicesManager`. Services are particularly well suited to
address [cross-cutting concerns][cross-cutting-concerns].

<div style="text-align: center;">
  <a href="/assets/img/services.png">
    <img src="/assets/img/services.png" alt="UI Services Diagram" style="margin: 0 auto; max-width: 500px;" />
  </a>
  <div><i>Diagram showing relationship between React Context and UI Service</i></div>
</div>

Each service should be:

- self-contained
- able to fail and/or be removed without breaking the application
- completely interchangeable with another module implementing the same interface

### An Example

The simplest service return a new object that has a `name` property, and
methods/properties that give the service its functionality. The "Factory
Function" that creates the service is provided with the implementation (this is
slightly different for UI Services).

```js
const _speak = () => {
  console.warn('Speak is not implemented');
};

/**
 * Factory function to create `HelloWorldService`
 *
 * @param {object} implementation
 * @param {function} implementation.speak - Speak's implementation
 * @returns HelloWorldService
 */
export default function createHelloWorldService({ speak }) {
  return {
    name: 'HelloWorldService',
    speak: speak || _speak,
  };
}
```

A service, once created, can be registered with the `ServicesManager` to make it
accessible to extensions. Similarly, the application code can access named
services from the `ServicesManager`.

```js
// In the application
const speak = () => {
  window.alert('HELLO WORLD');
};
const HelloWorldService = createHelloWorldService({ speak });
const servicesManager = new ServicesManager();

servicesManager.registerService(HelloWorldService);

// In an extension
const { HelloWorldService } = servicesManager.services;

if (HelloWorldService) {
  HelloWorldService.speak();
}
```

### A work in progress

Today, we only have maintained UI Services. You can read more about them below.

In practice, services are live, but the patterns and guidance for them may shift
slightly as we begin to develop real-world features that utilize them.

## UI Services

A typical web application will have components and state for common UI like
modals, notifications, dialogs, etc. A UI service makes it possible to leverage
these components from an extension.

We maintain the following UI Services:

- [UIDialogService](./ui/ui-dialog-service.md)
- [UIModalService](./ui/ui-modal-service.md)
- [UINotificationService](./ui/ui-notification-service.md)

You can read more about a specific service by selecting it in the above list,
and more about [UI services in general: here](./ui/index.md)

## Parting Words

Services are "concern-specific" code modules that can be consumed across layers.
We try to minimize the coupling they introduce by authoring services that are
able to fail or be removed. Related patterns that may reduce coupling include:

- Pub/Sub
- Commands

<!--
  LINKS
  -->

<!-- prettier-ignore-start -->
[commands]: #/
[core-services]: https://github.com/OHIF/Viewers/tree/master/platform/core/src/services
[services-manager]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/ServicesManager.js
[cross-cutting-concerns]: https://en.wikipedia.org/wiki/Cross-cutting_concern
<!-- prettier-ignore-end -->
