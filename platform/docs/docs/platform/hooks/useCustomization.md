---
title: useCustomization
summary: A React hook that provides reactive access to customization values from the customization service so UI components automatically reflect configuration changes.
---

# useCustomization

The `useCustomization` hook lets your component access a customization value from the **Customization Service** and automatically re-render whenever that value changes in any scope (default, mode, or global).

## Overview

Pass the customization key (path) you are interested in, and the hook returns the current value.  Behind the scenes it subscribes to all customization-change events and updates state for you, keeping your UI in sync with configuration changes at runtime.

Typical use-cases include:

- Styling a component (e.g. thumbnail size, colours) via remote configuration.
- Toggling feature flags that may be overridden by modes or global config.
- Reading extension-defined defaults that a deployment may adapt.

## Import

```js
import { useCustomization } from '@ohif/core';
```

## Usage

```jsx
function Thumbnail({ displaySetInstanceUID }) {
  // The key format is up to the extension / app that registered it
  const styles = useCustomization(`ui.thumbnail#${displaySetInstanceUID}`);

  return (
    <div style={styles?.container} className="thumbnail">
      {/* ... */}
    </div>
  );
}
```

If no customization is registered for the key, the hook returns `undefined` so you can fall back to defaults.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `customizationKey` | `string` | ✅ | A fully-qualified key or path identifying the customization value to retrieve (e.g. `studyBrowser.sortFunctions`, `ui.thumbnail#12345`). |

## Returns

`Customization | undefined`

The current value stored under the provided key in the Customization Service, or `undefined` if none is registered.

## Events

The hook automatically re-subscribes and updates when any of the following Customization Service events fire:

- `DEFAULT_CUSTOMIZATION_MODIFIED`
- `MODE_CUSTOMIZATION_MODIFIED`
- `GLOBAL_CUSTOMIZATION_MODIFIED`

No manual subscription / cleanup is required – the hook handles it for you.

## Implementation Details

Internally the hook:

1. Retrieves the `customizationService` from the `SystemProvider`.
2. Fetches the current value with `getCustomization(customizationKey)`.
3. Subscribes to all customization modification events and sets state when the value changes.
4. Cleans up all subscriptions when the component is unmounted or the key changes.

Since it stores the key in a `ref`, switching to a different key within the same component correctly triggers a fresh lookup and event subscription.
