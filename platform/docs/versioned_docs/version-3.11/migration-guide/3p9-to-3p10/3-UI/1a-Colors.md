---
title: Colors
summary: Migration guide for OHIF 3.10's new color system, explaining the transition from custom color names to a semantic color palette using CSS variables, with detailed mapping of old color classes to new Tailwind equivalents.
---


**Key Changes:**

*   **New Color System:** Migration from custom color names (e.g., `aqua-pale`, `common-bright`) to a semantic color palette using CSS variables (e.g., `--primary`, `--secondary`, `--muted-foreground`). Tailwind classes like `text-primary`, `bg-secondary`, `text-muted-foreground` should now be used.
*   **Deprecated Color Classes:** Custom color classes like `text-aqua-pale` and `text-common-bright` have been removed and need replacement.
*   **Simplified State Classes:** Explicit hover/active state classes like `bg-primary-main`, `hover:bg-primary-light`, `active:text-primary-light` seem to be replaced by simpler base classes (e.g., `bg-primary`) where Tailwind's state variants (`hover:`, `active:`) modify the base color, or these states are handled by component variants (e.g., in a Button component).
*   **Component Abstraction:** Some styling, especially for interactive elements like buttons, has been abstracted into components (e.g., `ViewportActionButton`, UI library buttons) which use predefined variants (`default`, `secondary`, `ghost`) instead of manual style combinations.

:::note
You can look at the set of colors in the [Color System](/colors-and-type)
:::


**Migration Steps:**

1.  **Identify Deprecated Color Classes:**
    Search your codebase for the old custom color classes. The most common ones identified in the diff are:
    *   `text-aqua-pale`
    *   `text-common-bright`
    *   `text-primary-active`
    *   `bg-primary-main`
    *   `hover:bg-primary-light`
    *   `hover:text-black` (when used with primary hover states)
    *   Potentially others using similar custom names.

2.  **Replace with New Semantic Colors:**
    Update the deprecated classes with their likely semantic equivalents from the new system. Use the table below as a guide. **Note:** The exact replacement might depend on the specific context and desired visual outcome. Inspect the element in the browser after changes to ensure it matches the intended design.

    | Old Class                 | Likely New Class(es)                                      | Notes                                                                 |
    | :------------------------ | :-------------------------------------------------------- | :-------------------------------------------------------------------- |
    | `text-aqua-pale`          | `text-muted-foreground`                                   | Used for less prominent text, now uses the muted foreground color.    |
    | `text-common-bright`      | `text-foreground` or `text-primary-foreground`            | Likely the default bright text color.                                 |
    | `text-primary-active`     | `text-primary` or `text-highlight`                        | Simplified to the base primary color or potentially a highlight color.  |
    | `bg-primary-main`         | `bg-primary`                                              | Simplified to the base primary background color.                      |
    | `text-white` (on dark bg) | `text-foreground` or `text-primary-foreground`            | Use the standard foreground color for the theme.                      |
    | `bg-black` (for elements) | `bg-background`, `bg-popover`, `bg-card`, or `bg-muted` | Use semantic background colors depending on the element's role.       |

3.  **Update State Variants and Interactions:**
    Classes managing hover, active, or focus states have likely been simplified or moved into component variants.

    *   **Remove Explicit Hover/Active Styles:** Search for combinations like `hover:bg-primary-light`, `hover:text-black`, `active:text-primary-light` and remove them if the element now uses a base class like `bg-primary` or component variants. Tailwind's built-in state modifiers (`hover:`, `active:`) might handle this automatically with the new base colors, or component variants encapsulate these states.
    *   **Use Component Variants:** If the element is now a component from a UI library (like `Button` from `@ohif/ui-next`), use its variants (`variant="default"`, `variant="secondary"`, `variant="ghost"`) instead of manual style combinations.

    *Example Diff:*
    ```diff
    - <div className="bg-primary-main hover:bg-primary-light text-white hover:text-black rounded p-2">
    -  Action Button
    - </div>

    + <Button variant="default">
    +   Action Button
    + </Button>
    ```

    *Example Diff:*
    ```diff
    // Before (in _getStatusComponent.tsx)
    - <div
    -   className="bg-primary-main hover:bg-primary-light ml-1 cursor-pointer rounded px-1.5 hover:text-black"
    -   onMouseUp={onStatusClick}
    - >
    -   {loadStr}
    - </div>

    // After (in OHIFCornerstoneRTViewport.tsx using the abstracted component)
    + <ViewportActionButton onInteraction={onStatusClick}>
    +   {loadStr}
    + </ViewportActionButton>
    ```
