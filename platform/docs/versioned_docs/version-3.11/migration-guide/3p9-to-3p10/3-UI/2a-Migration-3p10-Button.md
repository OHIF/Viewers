---
title: Button
summary: Migration guide for Button components in OHIF 3.10, explaining the transition from @ohif/ui to @ohif/ui-next, the replacement of ButtonEnums with string-based variants, and changes to IconButton, ButtonGroup, and styling approach.
---

## Key Changes:

*   **Component Library:** The primary `Button` component likely now resides in `@ohif/ui-next` instead of `@ohif/ui`. Imports need to be updated.
*   **`ButtonEnums` Deprecated:** The `ButtonEnums.type` (e.g., `ButtonEnums.type.primary`) used for button styling is deprecated. Styling is now primarily controlled by the `variant` prop using string literals (`'default'`, `'secondary'`, `'ghost'`, `'link'`).
*   **Styling Approach:** Manual Tailwind CSS classes for styling (colors, hover states, sizing) are largely replaced by the `variant` and `size` props on the new `Button` component. Semantic color names are used internally.
*   **`IconButton` Replacement:** The pattern of using a dedicated `IconButton` component is often replaced by using `<Button variant="ghost" size="icon">` and embedding an icon component (like `<Icons.ByName name="..." />`) within it.
*   **`ButtonGroup` Deprecated:** The `ButtonGroup` component is deprecated and replaced by the `Tabs`, `TabsList`, and `TabsTrigger` components from `@ohif/ui-next` for creating selectable groups.
*   **Specific Action Buttons:** In certain contexts (like viewport actions or footers), generic buttons or styled `div` elements might be replaced by more specific components like `ViewportActionButton` or composite components like `FooterAction`.
*   **Color System:** Custom color classes (e.g., `text-primary-active`, `bg-primary-main`) are replaced by a new semantic color system (e.g., `text-primary`, `bg-primary`, `text-muted-foreground`). Variants often handle color states (hover, active) automatically.

## Migration Steps:

1.  **Update Imports:**
    Replace imports for `Button` and related enums from `@ohif/ui` with the new `Button` component, likely from `@ohif/ui-next`.

    ```diff
    - import { Button, ButtonEnums, IconButton } from '@ohif/ui';
    + import { Button, Icons } from '@ohif/ui-next';
    ```

3.  **Migrate Manual Styling to `variant` and `size` Props:**
    Remove custom Tailwind CSS classes for basic button appearance, hover states, and sizing. Use the `variant` (`'default'`, `'secondary'`, `'ghost'`, `'link'`) and `size` (`'sm'`, `'default'`, `'lg'`, `'icon'`) props instead.

    *Example (`DynamicVolumeControls.tsx` change):*
    ```diff
    - <Button
    -   className="mt-2 !h-[26px] !w-[115px] self-start !p-0"
    -   onClick={() => { onGenerate(computeViewMode); }}
    - >
    + <Button
    +   variant="default"
    +   size="sm"
    +   className="mt-2 h-[26px] w-[115px] self-start p-0" // Keep only necessary layout/positioning classes
    +   onClick={handleGenerate}
    + >
        Generate
      </Button>
    ```

5.  **Replace `IconButton`:**
    Update instances of `<IconButton>` to use `<Button variant="ghost" size="icon">`. Place the icon component from `@ohif/ui-next` (e.g., `<Icons.ByName name="icon-name" />`) inside the button.

    *Example (`DynamicVolumeControls.tsx` change):*
    ```diff
    - <IconButton
    -   className="bg-customblue-30 h-[26px] w-[58px] rounded-[4px]"
    -   onClick={() => onPlayPauseChange(!isPlaying)}
    - >
    -   <Icon
    -     name={getPlayPauseIconName()}
    -     className="active:text-primary-light hover:bg-customblue-300 h-[24px] w-[24px] cursor-pointer text-white"
    -   />
    - </IconButton>
    + <Button
    +   id="play-pause-button"
    +   variant="secondary" // Or "ghost" depending on final desired style
    +   size="default"      // Or "icon" if only icon is needed
    +   className="w-[58px]" // Keep specific width if necessary
    +   onClick={() => {
    +     if (typeof onPlayPauseChange === 'function') {
    +       onPlayPauseChange(!isPlaying);
    +     }
    +   }}
    + >
    +   <Icons.ByName
    +     name={getPlayPauseIconName()}
    +     className="text-foreground h-[24px] w-[24px]" // Use semantic colors
    +   />
    + </Button>
    ```

6.  **Replace `ButtonGroup` with `Tabs`:**
    Refactor sections using `ButtonGroup` to use the `Tabs`, `TabsList`, and `TabsTrigger` components. Manage the selected state using the `value` and `onValueChange` props of the `Tabs` component.

    *Example (`DynamicVolumeControls.tsx` change):*
    ```diff
    - <ButtonGroup className="mt-2 w-full">
    -   <button className="w-1/2" onClick={() => setComputedView(false)}>4D</button>
    -   <button className="w-1/2" onClick={() => setComputedView(true)}>Computed</button>
    - </ButtonGroup>

    + <Tabs
    +   value={computedView ? 'computed' : '4d'}
    +   onValueChange={value => setComputedView(value === 'computed')}
    +   className="my-2 w-full"
    + >
    +   <TabsList className="w-full">
    +     <TabsTrigger value="4d" className="w-1/2">4D</TabsTrigger>
    +     <TabsTrigger value="computed" className="w-1/2">Computed</TabsTrigger>
    +   </TabsList>
    + </Tabs>
    ```

7.  **Identify Specific Component Replacements:**
    Review areas where styled `div` elements were used as buttons. Replace them with appropriate components like `<Button>` or domain-specific ones if available (e.g., `ViewportActionButton`).

    *Example (`_getStatusComponent.tsx` change):*
    ```diff
    - <div
    -   className="bg-primary-main hover:bg-primary-light ml-1 cursor-pointer rounded px-1.5 hover:text-black"
    -   onMouseUp={onStatusClick}
    - >
    -   {loadStr}
    - </div>
    + <ViewportActionButton onInteraction={onStatusClick}>{loadStr}</ViewportActionButton>
    ```

    *Example (`VolumeRenderingPresetsContent.tsx` change):*
    ```diff
    - <Button
    -   name="Cancel"
    -   size={ButtonEnums.size.medium}
    -   type={ButtonEnums.type.secondary}
    -   onClick={onClose}
    - > Cancel </Button>
    + <FooterAction>
    +   <FooterAction.Right>
    +     <FooterAction.Secondary onClick={hide}>Cancel</FooterAction.Secondary>
    +   </FooterAction.Right>
    + </FooterAction>
    ```
