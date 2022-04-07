# Services Overview

- [Overview](#overview)
- [Kinds of Services](#kinds-of-services)
  - [Services (default)](#services-default)
  - [UI Services](#ui-services)
- [Related Patterns](#related-patterns)

## Overview

Services are a beefier version of [commands][commands]. They provide a set of
operations, often tied to some shared state, and are made available to
extensions via the `ServicesManager`. Services are particularly well suited to
address [cross-cutting concerns][cross-cutting-concerns].

Each service should be:

- self-contained
- able to fail and/or be removed without breaking the application
- completely interchangeable with another module implementing the same interface

## Kinds of Services

Depending on the kind of service, we follow slightly different conventions. For
example, a UI service often receives its implementation from a React Context
Provider. You can read more about the different kinds of services and what makes
them different below:

### Services (default)

Services are a work in progress. As we are still in the progress of creating a
non-ui maintained service, this usage may change.

[You can read more about default services: here](./default/index.md)

### UI Services

A typical web application will have components and state for common UI like
modals, notifications, dialogs, etc. A UI service makes it possible to leverage
these components from an extension.

We maintain the following UI Services:

- [UIDialogService](./ui/ui-dialog-service.md)
- [UIModalService](./ui/ui-modal-service.md)
- [UINotificationService](./ui/ui-notification-service.md)

You can read more about a specific service by selecting it in the above list,
and more about [UI services in general: here](./ui/index.md)

## Related Patterns

Services are "concern-specific" code modules that can be consumed across layers.
We try to minimize the coupling they introduce by authoring services that are
able to fail or be removed. Related patterns that may reduce coupling include:

- Pub/Sub
- Commands

<!--
  LINKS
  -->

<!-- prettier-ignore-start -->
[commands]: ../extensions/modules/commands.md
[core-services]: https://github.com/OHIF/Viewers/tree/master/platform/core/src/services
[services-manager]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/ServicesManager.js
[cross-cutting-concerns]: https://en.wikipedia.org/wiki/Cross-cutting_concern
<!-- prettier-ignore-end -->
