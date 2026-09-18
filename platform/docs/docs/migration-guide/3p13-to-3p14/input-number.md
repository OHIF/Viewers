---
sidebar_position: 10
sidebar_label: InputNumber
title: InputNumber constraints reach descendants only
---

# `InputNumber` constraints reach descendants only

`InputNumber.HorizontalControls` and `InputNumber.VerticalControls` accept `min`,
`max`, `step` and `disabled`, and they share those constraints with
`InputNumber.Input` through the `InputNumber` context.

3.14 changes **how** they share the constraints. The change fixes a defect, and it
narrows the contract at the same time.

## What changed

**Before (3.13):** the controls wrote the constraints onto the context object that
the root had already created.

**After (3.14):** the controls render their own `InputNumberContext.Provider`, with
a new context value that carries the constraints.

## The defect this fixes

The root re-creates its context value whenever the input value changes. That
discarded the constraints that the controls had written onto the previous object,
on every keystroke, until the effect ran again. Children that had already rendered
never saw the constraints at all.

After the change, a child has the constraints on its first render, and no
keystroke can discard them.

## What this narrows

A nested provider only reaches the children of the controls. Before the change,
the mutation reached every consumer of the root context, wherever it sat in the
tree.

**This keeps working:**

```tsx
<InputNumber value={value} onChange={setValue}>
  <InputNumber.HorizontalControls min={0} max={10} step={0.5}>
    <InputNumber.Input />   {/* a descendant: gets min=0, max=10, step=0.5 */}
  </InputNumber.HorizontalControls>
</InputNumber>
```

**This silently stops working:**

```tsx
<InputNumber value={value} onChange={setValue}>
  <InputNumber.HorizontalControls min={0} max={10} step={0.5} />
  <InputNumber.Input />     {/* a sibling: falls back to min=0, max=100, step=1 */}
</InputNumber>
```

In the second layout, `InputNumber.Input` is not a descendant of the controls, so
it does not see the constraints. It falls back to the defaults of
`InputNumber.Input`, which are `min=0`, `max=100` and `step=1`. Nothing errors and
nothing warns. The input simply accepts a wider range than you intended.

## What to do

Check every place that renders `InputNumber.Input` as a **sibling** of
`InputNumber.HorizontalControls` or `InputNumber.VerticalControls`. Choose one of
two fixes:

1. Move the `InputNumber.Input` inside the controls, as in the first example.
2. Pass `min`, `max` and `step` to `InputNumber.Input` directly. An explicit prop
   on the input wins over the context in both 3.13 and 3.14:

```tsx
<InputNumber.Input min={0} max={10} step={0.5} />
```

No component inside this repository uses the sibling layout, so OHIF itself needs
no change. This note is for consumers who compose `InputNumber` themselves.
