---
sidebar_position: 9
sidebar_label: useCustomization
title: Read customizations with useCustomization
---

# Read customizations with `useCustomization`

3.14 adds `useCustomization` to `@ohif/core`. If a component of yours reads a
customization during render by calling `customizationService.getCustomization`
directly, you should move that read to the hook.

This is not only a tidier API. Under the React Compiler, the direct call can
freeze at a stale value.

## Why the direct call is no longer safe

`customizationService.getCustomization` returns whatever is registered at the
moment you call it. Registration order is not guaranteed:

- Mode-scope customizations are registered in `mode.onModeEnter`, which can run
  **after** panels have already rendered.
- Global-scope customizations can be written at runtime by a `?customization=`
  URL override, or by any consumer that calls `setCustomizations`.

Before 3.14 a component that read too early got the pre-registration value on its
first render, and then got the registered value on any later render.

3.14 turns on the React Compiler, which caches the call on the service reference.
The service reference never changes, so the compiler can serve the first result
for the life of the component. The component then keeps the pre-registration value
and never converges.

## What to change

**Before:**

```tsx
function MyPanel() {
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;
  const config = customizationService.getCustomization('myExtension.myPanel');

  return <div>{config.title}</div>;
}
```

**After:**

```tsx
import { useCustomization } from '@ohif/core';

function MyPanel() {
  const config = useCustomization<MyPanelConfig>('myExtension.myPanel');

  return <div>{config.title}</div>;
}
```

The hook takes the customization id and returns the current value. The generic
parameter types the return value, and it defaults to `unknown`.

## What the hook does

- It reads the value once for the first render.
- It reads again in an effect, which catches any registration that happened
  between the render and the effect.
- It subscribes to `MODE_CUSTOMIZATION_MODIFIED`,
  `GLOBAL_CUSTOMIZATION_MODIFIED` and `DEFAULT_CUSTOMIZATION_MODIFIED`, so a write
  to any of the three scopes re-renders the component with the new value.

`getCustomization` caches the transformed value, so an unchanged customization
returns the same reference and `setState` bails out. The extra events are
therefore cheap.

## When you do not need the hook

An event handler may keep calling `customizationService.getCustomization`
directly. A handler runs at event time, not during render, so the compiler does
not cache its result and the value is always current.

Code outside a React component — a command, a service, a mode lifecycle hook —
also keeps calling the service directly.

## Related

The same rule about values that freeze under the compiler applies to any read of
mutable state during render. See the
[React 19 guide](./react-19.md).
