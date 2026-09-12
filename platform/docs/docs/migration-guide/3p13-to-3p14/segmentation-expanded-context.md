---
sidebar_position: 6
sidebar_label: useSegmentationExpanded
title: useSegmentationExpanded no longer throws
---

# `useSegmentationExpanded` no longer throws

`useSegmentationExpanded` used to throw when a component was rendered outside a
`SegmentationExpandedProvider`. In 3.14 it returns `undefined` instead.

**Before (3.13):**

```ts
const useSegmentationExpanded = (componentName?: string) => {
  const context = useContext(SegmentationExpandedContext);

  if (context === undefined) {
    throw new Error(
      `useSegmentationExpanded must be used within a SegmentationExpandedProvider` +
        (componentName ? ` (called from ${componentName})` : '')
    );
  }

  return context;
};
```

**After (3.14):**

```ts
const useSegmentationExpanded = (): SegmentationExpandedContextType | undefined =>
  useContext(SegmentationExpandedContext);
```

The `componentName` argument is gone. It only existed to name the component in the
error message, and passing it is now harmless but ignored.

## Why

Most consumers render both inside and outside the provider, and treat "no context"
as a normal fallback rather than a fault. Because the hook threw, every one of them
wrapped it like this:

```ts
let segmentation;

try {
  const context = useSegmentationExpanded();
  segmentation = context.segmentation;
} catch (e) {
  segmentation = activeSegmentation;
}
```

A hook call inside a `try` block violates the rules of hooks: if the call order can
change between renders, React's hook state can be read against the wrong slot. It
also makes the React Compiler refuse to optimize the entire component, so these
files got no automatic memoization at all.

That pattern had already been copied into three components. Removing the throw
removes the reason to write it.

## What you need to change

**If you catch the throw, stop catching it and check for `undefined`:**

```ts
// Before
let segmentation;
try {
  segmentation = useSegmentationExpanded().segmentation;
} catch (e) {
  segmentation = activeSegmentation;
}

// After
const expandedContext = useSegmentationExpanded();
const segmentation = expandedContext ? expandedContext.segmentation : activeSegmentation;
```

**If you rely on the throw to catch a missing provider, assert in your component:**

```ts
const expandedContext = useSegmentationExpanded();

if (!expandedContext) {
  throw new Error('MyComponent must be rendered inside a SegmentationExpandedProvider');
}

const { segmentation } = expandedContext;
```

This is what `SegmentationCollapsedSelector` now does. Asserting at the call site
means the error names the component that actually has the requirement, instead of
naming the hook.

:::note TypeScript callers get a compile error; JavaScript callers do not
The return type is now `SegmentationExpandedContextType | undefined`, so TypeScript
flags any code that uses the result without handling the absent case.

Plain JavaScript gets no such warning. Code like
`const { segmentation } = useSegmentationExpanded()` used to fail with a clear
"must be used within a SegmentationExpandedProvider" message and will now fail with
`TypeError: Cannot destructure property 'segmentation' of undefined`, reported
wherever the value is first used rather than where the provider is missing. If you
consume this hook from JavaScript, add one of the two patterns above.
:::
