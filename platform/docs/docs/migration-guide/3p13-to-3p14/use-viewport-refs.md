---
sidebar_position: 7
sidebar_label: Viewport element hooks
title: useViewportRef is replaced by two hooks
---

# `useViewportRef` is replaced by two hooks

The viewport element registry lets a component reach a viewport's DOM element by
viewport ID when it is not that viewport's child. Its API has changed shape.

| 3.13 | 3.14 |
|---|---|
| `useViewportRef(viewportId)` → `{ current, register, unregister }` | `useViewportElement(viewportId)` → `HTMLElement | null` |
| | `useViewportElementRegistration(viewportId)` → `{ register, unregister }` |
| `useViewportRefs()` | removed |
| `ViewportRefsProvider` | `ViewportElementsProvider` |

## If you read a viewport's element

**Before (3.13):**

```ts
const viewportRef = useViewportRef(viewportId);

useEffect(() => {
  const element = viewportRef.current;
  if (!element) {
    return;
  }
  // observe or measure it
}, [viewportRef]);
```

**After (3.14):**

```ts
const element = useViewportElement(viewportId);

useEffect(() => {
  if (!element) {
    return;
  }
  // observe or measure it
}, [element]);
```

The element type is the caller's assertion, as with `useRef<T>`:

```ts
const element = useViewportElement<HTMLDivElement>(viewportId);
```

## If you register a viewport's element

**Before (3.13):**

```ts
const viewportRef = useViewportRef(viewportId);

<div ref={el => { if (el) { viewportRef.register(el); } }} />

// in your teardown
viewportRef.unregister();
```

**After (3.14):**

```ts
const { register, unregister } = useViewportElementRegistration(viewportId);

<div ref={el => { if (el) { register(el); } }} />

// in your teardown, unchanged
unregister();
```

`unregister` is a plain function rather than something handled by a ref cleanup, so
you keep control of when it runs relative to the rest of your teardown. If you were
unregistering after disabling a cornerstone element, that ordering is preserved.

## Why

The old hook returned one object serving two different callers, shaped like a React
ref. Three problems followed from that.

**`.current` was a snapshot, not a live box.** It was read during render and only
re-read if the hook's own inputs changed. Registering an element is not a render,
so it did not refresh — a component that ran the hook before its viewport attached
its element would hold `null` for as long as it stayed mounted. In 3.13 this was
masked: nothing was memoized, so the snapshot was retaken on every render and
happened to stay correct. Under React 19 with the React Compiler it no longer is.

`useViewportElement` reads through `useSyncExternalStore`, so the element arriving
is a state change. Notification is registry-wide, but `useSyncExternalStore`
compares the value it reads back, so watching one viewport does not re-render you
when another registers.

**The registrar could not use the field it populated.** A viewport calls the hook
during render, before any ref callback has run, so its own `.current` was always
`null`. Both viewports in this repository worked around it by keeping a private
`useRef` beside the registry one. `useViewportElementRegistration` gives the owner
only what it can use.

**Asking to register meant subscribing.** With one hook, a viewport that only
wanted `register` would also be subscribed to every registration in the app —
re-rendering the heaviest component in the viewer for a value it never reads.
`useViewportElementRegistration` subscribes to nothing.

## Also removed

The registry no longer exposes its `Map`. `useViewportRefs()` returned a
`viewportRefs` field holding the live `Map` of IDs to elements; a caller holding it
could add or remove entries without going through `register`/`unregister`, and could
read entries for viewports that had already unmounted.

If you were iterating it to find every mounted viewport, get the viewport IDs from
`ViewportGridService` and resolve each through `useViewportElement`. The grid service
is the authority on which viewports exist; the registry only ever knew which ones
had reported a DOM element.
