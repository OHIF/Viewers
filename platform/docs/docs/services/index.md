# Services And Managers

- [Services And Managers](#services-and-managers)
  - [Overview](#overview)
  - [Services](#services)

## Overview
Services are "concern-specific" code modules that can be consumed across layers. Services provide
a set of operations, often tied to some shared state, and are made available to
through out the app via the `ServicesManager`. Services are particularly well suited to
address [cross-cutting concerns][cross-cutting-concerns].

Each service should be:

- self-contained
- able to fail and/or be removed without breaking the application
- completely interchangeable with another module implementing the same interface


> In `OHIF-v3` we have added multiple non-UI services and have introduced **pub/sub** pattern to reduce coupling between layers.
>
> [Read more about Pub/Sub](./pubsub.md)


## Services
The following services is available in the `OHIF-v3`.

{% include "./_services.md" %}


<!--
  LINKS
  -->

<!-- prettier-ignore-start -->

[core-services]: https://github.com/OHIF/Viewers/tree/master/platform/core/src/services
[services-manager]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/ServicesManager.js
[cross-cutting-concerns]: https://en.wikipedia.org/wiki/Cross-cutting_concern
<!-- prettier-ignore-end -->
