---
title: UI
---


## `UINotificationService`


We've switched our custom notification service to the Sonner component from https://sonner.emilkowal.ski/

### 1. Toast Positions (Kebab-Case)

Toast positions are now defined using kebab-case instead of camelCase.  For instance, `topRight` becomes `top-right`, `bottomRight` becomes `bottom-right`, etc. Ensure your position strings are updated accordingly.

**Old API:**

```js
uiNotificationService.show({
  title: 'My Title',
  message: 'My Message',
  duration: 3000,
  position: 'topRight',
  type: 'error',
  autoClose: true,
});
```


**New API:**

```js
uiNotificationService.show({
  title: 'My Title',
  message: 'My Message',
  duration: 3000,
  position: 'top-right',  // Note the change to kebab-case
  type: 'error',
  autoClose: true,
});
```

### 2. Promise Support

The `show()` method now supports promises, enabling you to display loading notifications and automatically update them based on the promise's resolution or rejection. This significantly simplifies asynchronous operation feedback.

**Example:**

```js
const myPromise = someAsyncOperation();
const notificationId = uiNotificationService.show({
  title: 'Loading Data',
  message: 'Fetching data from server...',
  type: 'info',
  promise: myPromise,
  promiseMessages: {
    loading: 'Fetching...',
    success: (data) => `Data loaded: ${data.length} items`,  // Access promise result
    error: (error) => `Failed to load data: ${error.message}`, // Access error details
  },
});
// Optionally hide notification manually if needed
// myPromise.finally(() => uiNotificationService.hide(notificationId));
```

### 3. `hide()` API Change

The `hide()` method no longer takes an options object. It only accepts the notification ID as a string argument.

**Old API:**

```js
uiNotificationService.hide({ id: notificationId });
```

**New API:**

```js
uiNotificationService.hide(notificationId);
```


---


## Viewport Pane Tailwindcss class

Previously, when targeting the viewport pane to add custom CSS, you likely used `group-hover:visible` with the viewportPane having a `group` class.

The naming was confusing as we added more groups, so we renamed it to `group/pane`. Now you can apply `group-hover/pane` for better clarity.


---

## Header Component


Header Component has been refactored in the @ohif/ui-next package.


**Before**


```js
function Header({
  children,
  menuOptions,
  isReturnEnabled,
  onClickReturnButton,
  isSticky,
  WhiteLabeling,
  showPatientInfo,
  servicesManager,
  Secondary,
  appConfig,
  ...props
}: withAppTypes): ReactNode
```

**After**

```js
function Header({
  children,
  menuOptions,
  isReturnEnabled,
  onClickReturnButton,
  isSticky,
  WhiteLabeling,
  PatientInfo,
  Secondary,
  ...props
}: HeaderProps): ReactNode
```

The `PatientInfo` component is now preferred, and the `showPatientInfo` prop has been removed. The previous method depended on `servicesManager`, which was cumbersome because the UI shouldn't need to interact with `servicesManager`.

All the DropDown and Icons are now in the @ohif/ui-next package.


---
