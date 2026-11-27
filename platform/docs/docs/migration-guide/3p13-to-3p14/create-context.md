---
sidebar_position: 9
sidebar_label: createContext helper
title: The createContext helper is removed
---

# The `createContext` helper is removed

`platform/ui-next/src/lib/createContext.tsx` is deleted. It was an internal helper
that took a component name and an optional default, and returned a provider
component and a reader hook as a pair.

It was never exported from `@ohif/ui-next`, and `MeasurementTable` was its only
caller, so most projects cannot have been using it. If you built OHIF from source
and imported it directly, replace it with React's own context.

## Replacement

The examples below are the real change made to `MeasurementTable`, so you can read
the finished version in
`platform/ui-next/src/components/MeasurementTable/MeasurementTable.tsx`. Substitute
your own component and fields.

**Before:**

```tsx
import { createContext } from '../../lib/createContext';

const [MeasurementTableProvider, useMeasurementTableContext] = createContext<
  MeasurementTableContext
>('MeasurementTable', { data: [], isExpanded: true });

const MeasurementTable = ({ data = [], onAction, isExpanded = true, disableEditing = false, children }) => (
  <MeasurementTableProvider
    data={data}
    onAction={onAction}
    isExpanded={isExpanded}
    disableEditing={disableEditing}
  >
    {children}
  </MeasurementTableProvider>
);

const Row = () => {
  const { onAction, isExpanded, disableEditing } =
    useMeasurementTableContext('MeasurementTable.Row');
  // ...
};
```

**After:**

```tsx
const MeasurementTableContextValue = React.createContext<MeasurementTableContext>({
  data: [],
  isExpanded: true,
});

const MeasurementTable = ({ data = [], onAction, isExpanded = true, disableEditing = false, children }) => (
  <MeasurementTableContextValue.Provider value={{ data, onAction, isExpanded, disableEditing }}>
    {children}
  </MeasurementTableContextValue.Provider>
);

const Row = () => {
  const { onAction, isExpanded, disableEditing } = React.useContext(
    MeasurementTableContextValue
  );
  // ...
};
```

## Why there is no useMemo in the replacement

The helper existed to solve one problem. A context value written inline is a new
object on every render, so every consumer re-renders whenever the provider does.
The usual fix is `useMemo`, but a **generic** helper cannot name the dependencies
of props it has never seen, so it used a computed list:

```ts
const value = React.useMemo(
  () => context,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  Object.values(context)
);
```

That compares each context value individually rather than the props object, which
is the behaviour you want. It also requires suppressing `exhaustive-deps`, because a
dependency list is meant to be a fixed-length array literal.

Two separate things change when the context is written out at a concrete call site.

**The suppression goes away because the field names are known.** `MeasurementTable`
can write a real dependency array where the generic helper could not. This has
nothing to do with the compiler — without it, the honest replacement is:

```ts
const contextValue = React.useMemo(
  () => ({ data, onAction, isExpanded, disableEditing }),
  [data, onAction, isExpanded, disableEditing]
);
```

**The `useMemo` goes away because of the React Compiler.** It memoizes the object
literal on exactly those four values, so the wrapper is redundant and can be
dropped. That comparison is equivalent to what `Object.values(context)` achieved,
not better — the gain is that it costs no code and needs no suppression.

So if you are porting this pattern into a project that does **not** run the
compiler, keep the `useMemo` and pass `value={contextValue}`. The provider JSX is
otherwise the same; without it the value object is rebuilt every render and
consumers re-render with it.

## Behaviour to check when porting

The helper's reader hook took a component name and threw when no provider was
found:

```ts
if (context) return context;
if (defaultContext) return defaultContext;
throw Error(`${callerComponentName} must be rendered inside of a ${rootComponentName}...`);
```

Note the order: **a supplied default wins over the error.** `MeasurementTable` passed
`{ data: [], isExpanded: true }`, so its throw was unreachable and the component name
went unused — which is why the replacement has no wrapper hook. React's `useContext`
returns the default in exactly the same case, so dropping it changes nothing.

If you passed **no** default, the throw was live. To keep it, wrap `useContext`:

```ts
function useMeasurementTableContext(callerComponentName: string): MeasurementTableContext {
  const context = React.useContext(MeasurementTableContextValue);

  if (!context) {
    throw new Error(
      `${callerComponentName} must be rendered inside of a MeasurementTable component.`
    );
  }

  return context;
}
```

and create the context with no default —
`React.createContext<MeasurementTableContext | undefined>(undefined)` — so the guard
can actually fire.
