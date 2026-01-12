---
title: Input
summary: Migration guide for input components in OHIF 3.10, covering the transition from Input, InputNumber, InputRange, InputDoubleRange and others to the new Numeric component system and updated input patterns in @ohif/ui-next.
---


# Migration Guide: Input Components to @ohif/ui-next

This guide explains how to migrate from the existing `Input`, `InputNumber`, `InputRange`, `InputDoubleRange`, `InputFilterText`, `InputGroup`, `InputLabelWrapper`, and `InputText` components to their new equivalents or patterns using `@ohif/ui-next`, including the `Numeric` meta component for numeric inputs.




## Why Migrate?

  See the full list of components in the [Numeric Component Showcase](/components-list#numeric)


The old components relied heavily on props, making them complex and difficult to maintain and apply custom styles. The new `Numeric` component provides a structured approach with a context-based API, reducing prop clutter and improving reusability.

The `Numeric` component offers several advantages:
- **Versatile Modes**: It supports basic number input (`Numeric.NumberInput`), stepper controls (`Numeric.NumberStepper`), single range sliders (`Numeric.SingleRange`), and double range sliders (`Numeric.DoubleRange`).
- **Flexible Layout**: You have full control over the layout using standard CSS classes (`className`) on the container and its subcomponents like `Numeric.Label`, `Numeric.NumberInput`, etc., allowing for various arrangements (e.g., flex, grid).
- **Enhanced Customization**: Easily customize the appearance and behavior, such as showing/hiding associated number inputs for sliders, displaying the current value within the label (`showValue`), and integrating icons.
- **State Management**: Supports both controlled and uncontrolled component states.




## `Input type="number"` > `Numeric.NumberInput`

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


## `Input` / `InputText` (General) > `@ohif/ui-next Input + Label`

**Key Changes:**

*   The base `Input` component from `@ohif/ui` is replaced by the `Input` component from `@ohif/ui-next`.
*   Styling props like `labelClassName`, `containerClassName` are removed. Use standard `className` on the `Input` component and its container elements.
*   Labels provided via the `label` prop are removed. Use the separate `Label` component from `@ohif/ui-next` alongside the `Input`.
*   Layout is handled by standard HTML/Tailwind (Flexbox, Grid).

**Migration Steps:**

1.  **Update Import:** Ensure you are importing `Input` and `Label` from `@ohif/ui-next`.
2.  **Replace Label Prop:** If you used the `label` prop, add a separate `<Label>` component before the `<Input>`.
3.  **Handle Layout:** Wrap the `<Label>` and `<Input>` in a container `div` and use layout utilities (e.g., `flex`, `items-center`, `space-x-2`, `flex-col`) to position them correctly.
4.  **Transfer Styling:** Migrate styles from `className`, `labelClassName`, and `containerClassName` to the `className` prop of the new `Input`, `Label`, and container `div` as appropriate.

*Example Diff (Conceptual - derived from PanelPetSUV):*

```diff
- <Input
-   containerClassName={'flex flex-row justify-between items-center'}
-   label={'Weight'}
-   labelChildren={<span className="text-aqua-pale"> kg</span>}
-   labelClassName="text-[13px] text-white"
-   className="h-[26px] w-[117px]"
-   value={metadata.PatientWeight || ''}
-   onChange={handleWeightChange}
- />

+ <div className="flex flex-row items-center space-x-4"> {/* Replaced containerClassName */}
+   <Label className="min-w-32 flex-shrink-0 text-[13px] text-white"> {/* Replaced labelClassName */}
+     Weight
+     <span className="text-muted-foreground"> kg</span> {/* Replaced labelChildren */}
+   </Label>
+   <Input
+     className="h-7 flex-1 h-[26px] w-[117px]" {/* Merged input className */}
+     value={metadata.PatientWeight || ''}
+     onChange={handleWeightChange}
+   />
+ </div>
```


## `InputNumber` > `Numeric.NumberStepper`

**Key Changes:**

*   The `InputNumber` component is replaced by the `Numeric` component system using `mode="stepper"`.
*   Styling props like `sizeClassName`, `arrowsDirection`, and `labelPosition` are removed. Layout and styling are now controlled via standard `className` and parent container layouts (e.g., Flexbox).
*   Props like `value`, `onChange`, `minValue`, `maxValue`, and `step` are now typically set on the `Numeric.Container`.
*   Labels are handled by the separate `Numeric.Label` subcomponent.
*   Stepper controls are provided by the `Numeric.NumberStepper` subcomponent, which takes a `direction` prop (`horizontal` or `vertical`).

**Migration Steps:**

1.  **Replace Component:** Replace `<InputNumber ... />` with `<Numeric.Container mode="stepper" ... >`.
2.  **Transfer Props:** Move `value`, `onChange`, `minValue` (as `min`), `maxValue` (as `max`), and `step` props to the `Numeric.Container`.
3.  **Add Subcomponents:**
    *   Inside `Numeric.Container`, add `<Numeric.NumberStepper />`. Set its `direction` prop (`horizontal` or `vertical`) based on the old `arrowsDirection`. Apply sizing classes directly using `className`.
    *   Add a `<Numeric.Label>` component for the label text.
4.  **Handle Layout:** Wrap the `Numeric.Container` or arrange its children using standard layout techniques (like Flexbox) to achieve the desired positioning (equivalent to the old `labelPosition`). Apply styling classes as needed.

*Example Diff:*

```diff
- <InputNumber
-   value={currentFrameIndex}
-   onChange={onFrameChange}
-   minValue={0}
-   maxValue={framesLength - 1}
-   label="Frame"
-   sizeClassName="w-[58px] h-[28px]"
-   arrowsDirection="horizontal"
-   labelPosition="bottom"
- />

+ <Numeric.Container
+   mode="stepper"
+   value={currentDimensionGroupNumber || 1}
+   onChange={onDimensionGroupChange || (() => {})}
+   min={1}
+   max={numDimensionGroups || 1}
+   step={1}
+ >
+   <div className="flex flex-col items-center">
+     <Numeric.NumberStepper
+       className="h-[28px] w-[58px]"
+       direction="horizontal"
+     />
+     <Numeric.Label className="text-muted-foreground mt-1 text-sm">Frame</Numeric.Label>
+   </div>
+ </Numeric.Container>
```


## `InputRange` > `Numeric.SingleRange`

**Key Changes:**

*   `InputRange` is replaced by the `Numeric` component system using `mode="singleRange"`.
*   Props like `value`, `onChange`, `minValue` (`min`), `maxValue` (`max`), and `step` are set on the `Numeric.Container`.
*   The slider element itself is rendered using `<Numeric.SingleRange />`.
*   The `showLabel` prop is replaced by explicitly adding a `<Numeric.Label>` subcomponent. The label text is passed as children to `Numeric.Label`. You can optionally show the current value(s) within the label using the `showValue` prop on `Numeric.Label`.
*   The `allowNumberEdit` prop is replaced by the `showNumberInput` prop on `<Numeric.SingleRange />`.
*   Layout props like `labelPosition` are removed; use standard CSS/Tailwind for layout.

**Migration Steps:**

1.  **Replace Component:** Replace `<InputRange ... />` with `<Numeric.Container mode="singleRange" ... >`.
2.  **Transfer Props:** Move `value`, `onChange`, `minValue` (as `min`), `maxValue` (as `max`), and `step` to the `Numeric.Container`.
3.  **Add Subcomponents:**
    *   Inside, add `<Numeric.SingleRange />`.
    *   Use the `showNumberInput` prop on the range subcomponent if number editing was previously enabled (`allowNumberEdit={true}`).
    *   If `showLabel` was true, add a `<Numeric.Label>` component. Pass the label text as children. Use the `showValue` prop on the label if you want to display the numeric value alongside the text.
4.  **Handle Layout:** Arrange the `Numeric.Label` and the Range subcomponent using standard layout techniques (Flexbox, Grid) as needed. Apply styling directly using `className`.

*Example Diff (Conceptual):*

```diff
- <InputRange
-   value={opacity}
-   onChange={setOpacity}
-   minValue={0}
-   maxValue={100}
-   step={1}
-   showLabel={true}
-   label="Opacity"
-   allowNumberEdit={true}
- />

+ <Numeric.Container
+   mode="singleRange"
+   value={opacity}
+   onChange={setOpacity}
+   min={0}
+   max={100}
+   step={1}
+ >
+   <div className="flex items-center space-x-2"> {/* Example layout */}
+     <Numeric.Label showValue>Opacity</Numeric.Label>
+     <Numeric.SingleRange showNumberInput />
+   </div>
+ </Numeric.Container>
```


## `InputDoubleRange` > `Numeric.DoubleRange`

**Key Changes:**

*   `InputDoubleRange` is replaced by the `Numeric` component system using `mode="doubleRange"`.
*   Props like `values`, `onChange`, `minValue` (`min`), `maxValue` (`max`), and `step` are set on the `Numeric.Container`.
*   The slider element itself is rendered using `<Numeric.DoubleRange />`.
*   The `showLabel` prop is replaced by explicitly adding a `<Numeric.Label>` subcomponent. You can optionally show the current values within the label using the `showValue` prop on `Numeric.Label`.
*   Editing numbers is controlled by the `showNumberInputs` (plural) prop on `<Numeric.DoubleRange />`.
*   Layout props like `labelPosition` are removed; use standard CSS/Tailwind for layout.

**Migration Steps:**

1.  **Replace Component:** Replace `<InputDoubleRange ... />` with `<Numeric.Container mode="doubleRange" ... >`.
2.  **Transfer Props:** Move `values`, `onChange`, `minValue` (as `min`), `maxValue` (as `max`), and `step` to the `Numeric.Container`.
3.  **Add Subcomponents:**
    *   Inside, add `<Numeric.DoubleRange />`.
    *   Use the `showNumberInputs` prop on the range subcomponent if number editing is desired.
    *   If `showLabel` was true, add a `<Numeric.Label>` component. Pass the label text as children. Use the `showValue` prop on the label if you want to display the numeric values alongside the text.
4.  **Handle Layout:** Arrange the `Numeric.Label` and the Range subcomponent using standard layout techniques (Flexbox, Grid) as needed.

*Example Diff:*

```diff
- <InputDoubleRange
-   values={rangeValues}
-   onChange={handleSliderChange}
-   minValue={1}
-   maxValue={numDimensionGroups || 1}
-   showLabel={false} // Assuming label wasn't shown, or handled separately
-   step={1}
-   // Assuming number edit might have been implicitly enabled or desired
- />

+ <Numeric.Container
+   mode="doubleRange"
+   min={1}
+   max={numDimensionGroups || 1}
+   values={rangeValues || [1, numDimensionGroups || 1]}
+   onChange={onDoubleRangeChange || (() => {})}
+ >
+   {/* Label could be added here if needed */}
+   {/* <Numeric.Label>Range</Numeric.Label> */}
+   <Numeric.DoubleRange showNumberInputs />
+ </Numeric.Container>
```


## InputFilterText > InputFilter

**Key Changes:**

*   `InputFilterText` is replaced by the more composable `InputFilter` component from `@ohif/ui-next`.
*   `InputFilter` uses subcomponents (`InputFilter.SearchIcon`, `InputFilter.Input`, `InputFilter.ClearButton`) which are included by default but can be customized.
*   The `onDebounceChange` prop is replaced by a standard `onChange` prop on the main `InputFilter` component, which handles debouncing internally (configurable via `debounceTime`).
*   Props like `placeholder` and `value` are passed to the `InputFilter.Input` subcomponent (or directly to `InputFilter` for simplicity if using the default structure).

**Migration Steps:**

1.  **Replace Component:** Replace `<InputFilterText ... />` with `<InputFilter ... >`.
2.  **Transfer Props:**
    *   Move `placeholder` to the `InputFilter` component or its `InputFilter.Input` subcomponent.
    *   Handle `value` using controlled state if necessary, passing it to `InputFilter`.
3.  **Update Handler:** Replace the `onDebounceChange` handler with the `onChange` prop on the `InputFilter` component.
4.  **Styling:** Apply necessary classes for layout and positioning, especially padding on the input (e.g., `pl-9 pr-9`) to accommodate the default icon and clear button if using the defaults.

*Example Diff:*

```diff
- <InputFilterText
-   value={searchValue}
-   onDebounceChange={handleSearchChange}
-   placeholder={'Search all'}
- />

+ <InputFilter
+   value={searchValue}
+   onChange={setFilterValue} /* Direct state update or debounced handler */
+   placeholder="Search all"
+ >
+   {/* Using default structure which includes Icon, Input, ClearButton */}
+   {/* Example customization: */}
+   {/* <InputFilter.SearchIcon /> */}
+   {/* <InputFilter.Input placeholder="Search all" className="pl-9 pr-9" /> */}
+   {/* <InputFilter.ClearButton /> */}
+ </InputFilter>
```

## InputGroup / InputLabelWrapper > Composition

**Key Changes:**

*   These wrapper components (`InputGroup`, `InputLabelWrapper`) are deprecated.
*   Functionality (grouping label and input, optional sorting indicators) is now achieved through composition using standard layout techniques (Flexbox/Grid) and the base `@ohif/ui-next` components (`Label`, `Input`, `Icons`).

**Migration Steps:**

1.  **Remove Wrapper:** Delete the `<InputGroup>` or `<InputLabelWrapper>` tags.
2.  **Create Container:** Use a standard `div` as the container.
3.  **Add Label and Input:** Place the `<Label>` and the corresponding input/control component (e.g., `<Input>`, `<Select>`, custom component) inside the `div`.
4.  **Apply Layout:** Use Tailwind classes (`flex`, `grid`, `space-x-*`, `items-center`, etc.) on the container `div` to arrange the label and input as needed.
5.  **Add Sorting Icons (if applicable):** If migrating from `InputLabelWrapper` with `isSortable`, manually add the appropriate `<Icons.ByName name="sorting-..." />` component next to the label text within the `<Label>` component's children. Import `Icons` from `@ohif/ui-next`.
6.  **Apply Styling:** Add necessary styling classes directly to the `Label`, input component, and container `div`.

*Example Diff (Conceptual - derived from InputLabelWrapper usage):*

```diff
- <InputLabelWrapper
-   label="Patient Name"
-   isSortable={true}
-   sortDirection={sortDir}
-   onLabelClick={toggleSort}
- >
-   <Input value={patientName} onChange={setPatientName} />
- </InputLabelWrapper>

+ <div className="flex flex-col space-y-1"> {/* Example layout */}
+   <Label
+     onClick={toggleSort}
+     className="flex cursor-pointer items-center"
+   >
+     Patient Name
+     {sortDir === 'ascending' && <Icons.ByName name="sorting-ascending" className="ml-1 h-4 w-4" />}
+     {sortDir === 'descending' && <Icons.ByName name="sorting-descending" className="ml-1 h-4 w-4" />}
+     {sortDir === 'none' && <Icons.ByName name="sorting" className="ml-1 h-4 w-4" />}
+   </Label>
+   <Input value={patientName} onChange={setPatientName} />
+ </div>
```


---

## Summary of Changes

| Old Component         | New Component/Pattern Equivalent                     | Notes                                                                      |
|-----------------------|----------------------------------------------------|----------------------------------------------------------------------------|
| `<Input type="number">` | `<Numeric.NumberInput>`                            | Use `Numeric.Container` with `mode="number"`                               |
| `<Input>` / `<InputText>` | `@ohif/ui-next <Input>` + `<Label>`                  | Use standard `<div>` and CSS/Tailwind for layout                           |
| `<InputNumber>`       | `<Numeric.NumberStepper>`                          | Use `Numeric.Container` with `mode="stepper"`                              |
| `<InputRange>`        | `<Numeric.SingleRange>`                          | Use `Numeric.Container` with `mode="singleRange"`                          |
| `<InputDoubleRange>`  | `<Numeric.DoubleRange>`                          | Use `Numeric.Container` with `mode="doubleRange"`                          |
| `<InputFilterText>`   | `@ohif/ui-next <InputFilter>`                      | Composable component with internal debouncing                              |
| `<InputGroup>`        | Composition (`div`, `<Label>`, `<Input>`, etc.)    | Replaced by standard layout techniques                                     |
| `<InputLabelWrapper>` | Composition (`div`, `<Label>`, `<Input>`, `<Icons>`) | Replaced by standard layout techniques; manually add sort icons if needed |
