# UI Services

- [Overview](#/)
- [Example](#/)
- [Maintained Services](#/)
- [Tips & Tricks](#/)

## Overview

A typical web application will have components and state for common UI like
modals, notifications, dialogs, etc. A UI service makes it possible to leverage
these components from an extension.

<div style="text-align: center;">
  <a href="/assets/img/ui-services.png">
    <img src="/assets/img/ui-services.png" alt="UI Services Diagram" style="margin: 0 auto; max-width: 500px;" />
  </a>
  <div><i>Diagram showing relationship between React Context and UI Service</i></div>
</div>

In `@ohif/core`, we have a collection of service factories. We select one we
would like our application to support, create an instance of it, and pass that
instance to our `ServicesManager` AND to a React component (in this example,
`ModalContext`'s provider).

The `ModalContext`'s provider:

- Exposes context values
- Exposes methods that leverage `useCallback` hooks
- Sets the service's implementation in a `useEffect` hook

The `ServicesManager` is:

- Passed to the `ExtensionManager`
- The `ExtensionManager` makes the `ServicesManager` available to:
  - All of it's lifecycle hooks (`preInit`)
  - Each "getModuleFunction" (`getToolbarModule`, `getPanelModule`, etc.)

## An Example

That's all fine and good, but it's still a little too abstract. What does this
translate to in practice?

```js
// In the application
const UINotificationService = createUINotificationService();
const servicesManager = new ServicesManager();

servicesManager.registerService(UINotificationService);

// UI Service Provider
useEffect(() => {
  if (service) {
    service.setServiceImplementation({ hide, show });
  }
}, [service, hide, show]);

// In an extension
const { UINotificationService } = servicesManager.services;

if (UINotificationService) {
  UINotificationService.show('Hello from the other side 👋');
}
```

<div style="text-align: center;">
  <a href="/assets/img/notification-example.gif">
    <img src="/assets/img/notification-example.gif" alt="UI Service Notification Example" style="margin: 0 auto; max-width: 500px;" />
  </a>
  <div><i>GIF showing successful call of UINotificationService from an extension.</i></div>
</div>

## Tips & Tricks
