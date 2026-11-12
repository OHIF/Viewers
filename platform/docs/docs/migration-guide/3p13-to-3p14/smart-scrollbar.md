---
sidebar_position: 4
sidebar_label: SmartScrollbar
title: SmartScrollbar marked identity
---

# SmartScrollbar: `marked` must change identity

In 3.13, `SmartScrollbarFill` and `SmartScrollbarEndpoints` accepted a `marked` array
that was mutated in place, with a `version` prop bumped to signal the change.

That contract no longer holds. With the React Compiler enabled in 3.14, both components
memoize on `marked`, so a stable array identity means the rendered fill stops updating —
it refreshes only when unrelated geometry changes, such as a window resize.

**In 3.14, `marked` must change identity whenever its contents change.** The `version`
prop is removed from both components, and `ByteArrayHandle` no longer exposes it. Passing
it is a compile error — deliberately, since a silently-ignored prop would leave code on
the old contract rendering stale with nothing to signal it.

## If you use `useByteArray()`

Nothing to do. The hook now publishes a new view of the same buffer on every change, so
identity moves with content. Writes are still in place and still batched; the new view
shares the underlying memory and costs nothing.

## If you manage the array yourself

Publish a new identity whenever the contents change. `subarray()` returns a new view over
the same memory with no copy:

**Before (3.13):**

```ts
bytes[index] = 1;
setVersion(v => v + 1); // no longer sufficient on its own
```

**After (3.14):**

```ts
bytes[index] = 1;
setBytes(bytes.subarray()); // new identity, same buffer, no copy
```

Remove any `version` prop you were passing — it no longer exists on either component.
