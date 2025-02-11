---
title: Input Number, Range, and Double Range
---


# Migration Guide: Moving to `Numeric` Component

This guide explains how to migrate from the existing `Input`, `InputRange`, and `InputDoubleRange` components to the new `Numeric` meta component.


## Why Migrate?

The old components relied heavily on props, making them complex and difficult to maintain and apply custom styles. The new `Numeric` component provides a structured approach with a context-based API, reducing prop clutter and improving reusability.


## `Input` > `Numeric.NumberInput`

### Basic Usage

**Old Usage:**

```tsx
<Input
  id="example"
  label="Enter a number"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  type="number"
/>
```

**New Usage:**

```tsx
<Numeric.Container mode="number" value={value} onChange={setValue}>
  <Numeric.Label>Enter a number</Numeric.Label>
  <Numeric.NumberInput />
</Numeric.Container>
```



### `Input` with Custom Classes

#### **Old Usage (with containerClassName, labelClassName, and className)**

In the old implementation, we manually applied `containerClassName`, `labelClassName`, and `className` to style the `Input` component:

```tsx
<Input
  id="example"
  label="Enter a number"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  type="number"
  containerClassName="flex flex-col space-y-2"
  labelClassName="text-gray-500 text-sm"
  className="border rounded p-2"
/>
```


**New Usage (Migrating to `Numeric.NumberInput`)**

With `Numeric`, you should wrap everything inside `Numeric.Container`, and you can directly apply class names to its subcomponents:

```tsx
<Numeric.Container mode="number" value={value} onChange={setValue} className="flex flex-col space-y-2">
  <Numeric.Label className="text-gray-500 text-sm">Enter a number</Numeric.Label>
  <Numeric.NumberInput className="border rounded p-2" />
</Numeric.Container>
```


## `InputRange` > `Numeric.SingleRange`

### Basic Usage

**Old Usage:**

```tsx
<InputRange
  value={value}
  onChange={setValue}
  minValue={0}
  maxValue={100}
  step={1}
  showLabel
/>
```

**New Usage:**

```tsx
<Numeric.Container mode="singleRange" value={value} onChange={setValue} min={0} max={100} step={1}>
  <Numeric.Label showValue>Range</Numeric.Label>
  <Numeric.SingleRange showNumberInput />
</Numeric.Container>
```


### Custom Classes

**Old Usage**

```tsx
<InputRange
  value={value}
  onChange={setValue}
  minValue={0}
  maxValue={100}
  step={1}
  containerClassName="flex flex-col space-y-2"
  inputClassName="w-full bg-gray-700"
  labelClassName="text-gray-500 text-sm"
  labelVariant="body1"
  showLabel={true}
  labelPosition="left"
/>
```

**New Usage**

```tsx
<Numeric.Container mode="singleRange" value={value} onChange={setValue} min={0} max={100} step={1} className="flex flex-col space-y-2">
  <Numeric.Label className="text-gray-500 text-sm">Range</Numeric.Label>
  <Numeric.SingleRange sliderClassName="w-full bg-gray-700" />
</Numeric.Container>
```

:::note
You now have more control over the position of the label and the slider. You can use pretty much any layout you want, whether that's flex, grid, or something else. Instead of relying on `labelPosition` to position the label, you're free to use the layout that works best for you.
:::


### AllowNumberEdit

**Old Usage:**

```tsx
<InputRange
  value={value}
  onChange={setValue}
  minValue={0}
  maxValue={100}
  step={1}
  allowNumberEdit={true}
  showAdjustmentArrows={true}
/>
```

**New Usage:**

Using `Numeric.SingleRange` and `showNumberInput`

```tsx
<Numeric.Container mode="singleRange" value={value} onChange={setValue} min={0} max={100} step={1}>
  <Numeric.Label showValue>Range</Numeric.Label>
  <Numeric.SingleRange showNumberInput />
</Numeric.Container>
```


## `InputDoubleRange` > `Numeric.DoubleRange`


### Basic Usage
**Old Usage:**

```tsx
<InputDoubleRange
  values={rangeValues}
  onChange={setRangeValues}
  minValue={0}
  maxValue={100}
  step={5}
  showLabel
/>
```

**New Usage:**

```tsx
<Numeric.Container mode="doubleRange" values={rangeValues} onChange={setRangeValues} min={0} max={100} step={5}>
  <Numeric.Label showValue>Range</Numeric.Label>
  <Numeric.DoubleRange showNumberInputs />
</Numeric.Container>
```


---

## Summary of Changes

| Old Component      | New Component Equivalent |
|--------------------|------------------------|
| `<Input>`         | `<Numeric.NumberInput>` |
| `<InputRange>`    | `<Numeric.SingleRange>` |
| `<InputDoubleRange>` | `<Numeric.DoubleRange>` |
