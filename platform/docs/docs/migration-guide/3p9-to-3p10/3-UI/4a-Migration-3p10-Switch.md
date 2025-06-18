---
title: Switch
summary: Migration guide for Switch component in OHIF 3.10, covering the transition from custom Toggle and CinePlayPauseButton components to the standardized Switch component, with details on prop changes and usage patterns.
---


**Key Changes:**

*   **Component Renaming & Import Path:** The component `SwitchButton` from `@ohif/ui` has been replaced by `Switch` in `@ohif/ui-next`. You will need to update your import statements accordingly.
*   **Removal of `label` Prop:** The integrated `label` prop has been removed. Labels should now be implemented externally using standard HTML elements (like `<span>` or `<label>`) or the `<Label>` component from `@ohif/ui-next`. Layout between the label and the `Switch` needs to be handled explicitly, typically using Flexbox utility classes.
*   **Event Handler Prop Renamed:** The `onChange` event handler prop has been replaced with `onCheckedChange`. The new prop provides the updated boolean `checked` state directly as its argument.
*   **Styling and Layout:** The new `Switch` component relies on standard `className` prop and Tailwind utility classes for styling and layout adjustments, rather than internal props or structures.

**Migration Steps:**

1.  **Update Import Statement:**
    Change the import from `@ohif/ui` to `@ohif/ui-next` and rename the component.

    ```diff
    - import { SwitchButton } from '@ohif/ui';
    + import { Switch } from '@ohif/ui-next';
    + import { Label } from '@ohif/ui-next'; // Optional: If using the Label component
    ```

2.  **Replace Component Usage and Handle Label Externally:**
    Replace the `<SwitchButton>` tag with `<Switch>`. Remove the `label` prop and add an external element for the label. Use layout utilities (like `flex`) to position the label relative to the switch.

    *Example Diff:*
    ```diff
    - <SwitchButton
    -   label="Enable Feature"
    -   checked={isFeatureEnabled}
    -   onChange={handleToggle}
    - />

    + <div className="flex items-center space-x-2">
    +   <Switch
    +     id="feature-toggle" // It's good practice to add an id
    +     checked={isFeatureEnabled}
    +     onCheckedChange={handleToggle}
    +   />
    +   <Label htmlFor="feature-toggle">Enable Feature</Label> {/* Or use a <span> */}
    + </div>
    ```
    *Explanation:* The `label` prop is gone. A `<div>` with `flex` is used to arrange the new `<Switch>` and an associated `<Label>`. The `htmlFor` attribute on the `<Label>` links it to the `<Switch>` via its `id` for accessibility.

3.  **Update Event Handler Prop:**
    Rename the `onChange` prop to `onCheckedChange`. Ensure your handler function correctly receives the new boolean state as its argument.

    *Example Diff (within the component usage):*
    ```diff
    - onChange={checked => setIsEnabled(checked)}
    + onCheckedChange={checked => setIsEnabled(checked)}
    ```
    *Explanation:* The prop name changes from `onChange` to `onCheckedChange`. The callback function signature, receiving the boolean `checked` state, remains a common pattern and is directly supported by `onCheckedChange`. If your previous `onChange` did *not* receive the checked state directly (e.g., it just toggled existing state), you might need to adjust your handler logic slightly, but `onCheckedChange` directly provides the new state.
