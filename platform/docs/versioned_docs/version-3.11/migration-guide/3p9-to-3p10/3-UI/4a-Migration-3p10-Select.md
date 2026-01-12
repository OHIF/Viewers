---
title: Select
summary: Migration guide for Select components in OHIF 3.10, explaining the transition from @ohif/ui to @ohif/ui-next, with details on the new Select.Root, Select.Trigger, Select.Content, and Select.Item structure replacing the old dropdown approach.
---



This guide outlines the steps needed to migrate from the previous `<Select>` component (likely from `@ohif/ui`) to the new compound `<Select>` component provided by `@ohif/ui-next`.

## Key Changes

*   **Deprecated Component:** The previous standalone `<Select>` component is deprecated.
*   **New Compound Component:** The new implementation uses a compound component pattern, requiring multiple specific sub-components (`Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`).
*   **Option Definition:** Options are no longer passed as a single `options` prop. Instead, each option is rendered as an individual `<SelectItem>` component within `<SelectContent>`.
*   **Placeholder:** The `placeholder` prop is now applied to the `<SelectValue>` sub-component.
*   **Value Handling:** The `value` and `onValueChange` props are now managed by the root `<Select>` component. Note the change from `onChange` to `onValueChange`.

## Migration Steps

1.  **Update Imports:**
    Replace the import for the old `Select` component with imports for the new compound components from `@ohif/ui-next`.

    ```diff
    - import { Select } from '@ohif/ui';
    + import {
    +   Select,
    +   SelectContent,
    +   SelectItem,
    +   SelectTrigger,
    +   SelectValue,
    + } from '@ohif/ui-next';

    ```

2.  **Adapt Component Structure:**
    Replace the single `<Select>` tag with the new compound structure. Map your existing `options` array to individual `<SelectItem>` components.

    *Example Diff:*

    ```diff
    - <Select
    -   label={t('Strategy')}
    -   closeMenuOnSelect={true}
    -   className="border-primary-main mr-2 bg-black text-white"
    -   options={options}
    -   placeholder={options.find(option => option.value === config.strategy).placeHolder}
    -   value={config.strategy}
    -   onChange={({ value }) => {
    -     dispatch({
    -       type: 'setStrategy',
    -       payload: {
    -         strategy: value,
    -       },
    -     });
    -   }}
    - />

    + <Select
    +   value={config.strategy}
    +   onValueChange={value => {
    +     dispatch({
    +       type: 'setStrategy',
    +       payload: {
    +         strategy: value,
    +       },
    +     });
    +   }}
    + >
    +   <SelectTrigger className="w-full">
    +     <SelectValue
    +       placeholder={options.find(option => option.value === config.strategy)?.placeHolder}
    +     />
    +   </SelectTrigger>
    +   <SelectContent className="">
    +     {options.map(option => (
    +       <SelectItem
    +         key={option.value}
    +         value={option.value}
    +       >
    +         {option.label}
    +       </SelectItem>
    +     ))}
    +   </SelectContent>
    + </Select>
    ```

    **Explanation:**
    *   The main logic container is now the root `<Select>` component, which takes the `value` and the `onValueChange` handler (note: `onValueChange` directly receives the *value*, not an event object).
    *   `<SelectTrigger>` wraps the element that opens the dropdown (often styled like the previous select input).
    *   `<SelectValue>` displays the currently selected value or the `placeholder` text if no value is selected.
    *   `<SelectContent>` contains the list of options.
    *   Each option is rendered using `<SelectItem>`, where the `value` prop corresponds to the option's value and the children (`{option.label}`) represent the text displayed for that option.
    *   Props like `closeMenuOnSelect` are generally handled by default in the new component.

3.  **Adjust Styling:**
    The internal structure and default styling have changed. Remove or update previous CSS class names (`className`) applied to the old component and apply new Tailwind/CSS classes to the appropriate sub-components (`Select`, `SelectTrigger`, `SelectContent`, `SelectItem`) as needed to match your desired appearance. Note that `border-primary-main` and `bg-black` might no longer be necessary or applied differently with the new component's structure and variants.
