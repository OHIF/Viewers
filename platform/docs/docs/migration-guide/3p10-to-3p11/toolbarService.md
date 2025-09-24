---
sidebar_position: 2
sidebar_label: Toolbar Service
summary: Migration guide for OHIF 3.11's toolbar service changes, including the transition from `ViewportActionCornersService` to `ToolbarService`
---


**Key Changes:**

*   **`ViewportActionCornersService` Removed:** The `ViewportActionCornersService` and its associated provider (`ViewportActionCornersProvider`) and hook (`useViewportActionCorners`) have been removed. Functionality for viewport corner items is now integrated into the `ToolbarService` and standard toolbar components.
*   **Viewport Corner Items as Toolbar Buttons:** Items previously managed by `ViewportActionCornersService` are now configured as regular toolbar buttons. They are assigned to specific toolbar sections (e.g., `viewportActionMenu.topLeft`) and rendered using `Toolbar` components within the viewport corners.
*   **`ToolbarService` API Updates:**
    *   `ToolbarService.addButtons()` has been renamed to `ToolbarService.register()` to better reflect its purpose of registering button definitions rather than just adding them.
    *   `ToolbarService.createButtonSection()` has been renamed to `ToolbarService.updateSection()` to better reflect that it is not about creating new sections but updating existing ones.
    *   `ToolbarService` now has a `sections` property (e.g., `toolbarService.sections.viewportActionMenu.topLeft`) providing predefined section names.
*   **Enhanced `useToolbar` Hook:**
    *   The `useToolbar` hook now returns additional state management functions for toolbar items:
        *   `openItem`, `closeItem`, `isItemOpen` (for managing dropdown/popover states).
        *   `lockItem`, `unlockItem`, `toggleLock`, `isItemLocked`.
        *   `showItem`, `hideItem`, `toggleVisibility`, `isItemVisible`.
    *   The `onInteraction` callback now receives `itemId` and `viewportId`.
*   **Toolbar Button Configuration:**
    *   The `groupId` prop in button configurations (e.g., for `ohif.toolButtonList`, `ohif.toolBoxButtonGroup`) is generally replaced by directly using `buttonSection` to define the set of buttons.
    *   Button `evaluate` functions can now leverage `evaluateProps.hideWhenDisabled` to automatically hide a button when it's disabled.
*   **New UI Components & Hooks for Viewport Corners:**
    *   Specialized components like `ModalityLoadBadge`, `NavigationComponent`, `TrackingStatus`, `ViewportDataOverlayMenuWrapper`, `ViewportOrientationMenuWrapper`, `WindowLevelActionMenuWrapper` are now used as toolbar buttons, typically in viewport action menu sections.
    *   `useViewportHover` hook can be used to determine if a viewport is hovered or active, controlling the visibility of corner toolbars.
*   **`IconPresentationProvider`:** A new `IconPresentationProvider` and `useIconPresentation` hook have been introduced to standardize icon sizing and styling within toolbars and related components.
*   **Legacy Toolbar Components Removed:** `ToolbarSplitButtonWithServicesLegacy` and `ToolbarButtonGroupWithServicesLegacy` have been removed.

**Migration Steps:**

1.  **Update `ToolbarService` Method Calls:**
    *   Although the previous method also works but gives warning in the console when used.
    *   Replace all instances of `toolbarService.addButtons(...)` with `toolbarService.register(...)`.
    *   Replace all instances of `toolbarService.createButtonSection(...)` with `toolbarService.updateSection(...)`.

    ```diff
    // Before
    - toolbarService.addButtons(toolbarButtons);
    - toolbarService.createButtonSection('primary', ['Zoom', 'Pan']);

    // After
    + toolbarService.register(toolbarButtons);
    + toolbarService.updateSection('primary', ['Zoom', 'Pan']);
    ```

2.  **Migrate Viewport Action Corner Items:**
    *   Remove any direct usage of the old `ViewportActionCornersService`, `useViewportActionCorners`, or `ViewportActionCornersProvider`.
    *   Define your viewport corner items (like orientation menu, W/L menu, data overlay menu) as standard toolbar buttons using `toolbarService.register()`.
    *   Assign these buttons to the new dedicated viewport action menu sections. You can access these section names via `toolbarService.sections.viewportActionMenu.<location>`, e.g., `toolbarService.sections.viewportActionMenu.topLeft`.

    ```diff
    // Before: Customization in viewportActionMenuCustomizations.ts (now deleted)
    // or direct use of ViewportActionCornersService.addComponent
    - // Example: viewportActionCornersService.addComponent({ viewportId, id: 'orientationMenu', component: MyOrientationMenu, location: 'topLeft' });

    // After: In your mode's onModeEnter or similar setup
    + const myViewportCornerButtons = [
    +   {
    +     id: 'orientationMenu',
    +     uiType: 'ohif.orientationMenu', // Or your custom component registered as a UI type
    +     props: { /* ... props for your component ... */ }
    +   },
    +   // ... other corner buttons
    + ];
    + toolbarService.register(myViewportCornerButtons);
    + toolbarService.updateSection(
    +   toolbarService.sections.viewportActionMenu.topLeft,
    +   ['orientationMenu', /* other button IDs */]
    + );
    ```
    *   The `OHIFViewportActionCorners.tsx` component now internally uses `Toolbar` components for each corner, which are populated by these sections.
    *   For custom components that act as menus (e.g., popovers), use the `onOpen`, `onClose`, `isOpen` props passed down by the `Toolbar` component (which get these from `useToolbar`).

    ```diff
    // Before: Custom component might have managed its own open state
    - // const [isMenuOpen, setIsMenuOpen] = useState(false);
    - // const handleOpenChange = (open) => setIsMenuOpen(open);

    // After: Custom component receives isOpen, onOpen, onClose from Toolbar
    + function MyCustomMenuButton({ isOpen, onOpen, onClose, ...rest }) {
    +   const handleOpenChange = (openState: boolean) => {
    +     if (openState) {
    +       onOpen?.();
    +     } else {
    +       onClose?.();
    +     }
    +   };
    +
    +   return (
    +     <Popover open={isOpen} onOpenChange={handleOpenChange}>
    +       {/* ... PopoverTrigger and PopoverContent ... */}
    +     </Popover>
    +   );
    + }
    ```

3.  **Adapt Toolbar Button and Component Configurations:**

    The configuration of toolbar buttons, especially how they relate to sections

    *   **Button Section Association via `props.buttonSection`:**

        The toolbar service now offers two ways to define this association:

        *   **A. Simple Approach: `buttonSection: true` (Implicitly Uses Button's Own ID)**

            If a button definition includes `props: { buttonSection: true }`, the `ToolbarService` automatically sets the effective `buttonSection` ID to be the same as the button's own `id`.

            ```javascript
            // Example: A ToolButtonList component's definition in toolbarButtons.ts
            // {
            //   id: 'MeasurementTools', // ID of this ToolButtonList component
            //   uiType: 'ohif.toolButtonList',
            //   props: {
            //     buttonSection: true  // This ToolButtonList will render the section named 'MeasurementTools'
            //   }
            // }
            ```

            later you can use it like


            ```javascript
            toolbarService.updateSection('MeasurementTools', ['Length', 'Bidirectional', ...]);
            ```

        *   **B. Flexible Approach: `buttonSection: 'customSectionName'` (Explicit Section ID)**

            You can explicitly provide a string for `props.buttonSection` if the button should be associated with a section ID that is different from its own `id`, or if you prefer explicit naming.

            ```javascript
            // Example: A ToolButtonList component's definition
            // {
            //   id: 'MySpecialToolList', // ID of this ToolButtonList component
            //   uiType: 'ohif.toolButtonList',
            //   props: {
            //     buttonSection: 'toolsForAdvancedUsers',  // This list renders 'toolsForAdvancedUsers' section
            //   }
            // }
            ```

    *   **`evaluate` Function Enhancement:**
        *   Button `evaluate` functions can now leverage `evaluateProps: { hideWhenDisabled: true }` in your button definition to automatically hide a button when it's disabled.

    *   **Wrapper Component `onInteraction` (e.g., `ToolButtonListWrapper`):**
        *   Update wrappers like `ToolBoxButtonGroupWrapper` and `ToolButtonListWrapper`:
            *   The `groupId` prop is replaced by `id` (which is the ID of the wrapper button component itself).
            *   The `onInteraction` callback in these wrappers now provides `id` (the wrapper's ID) instead of `groupId`.


4.  **Adopt `IconPresentationProvider` (Optional but Recommended):**
    *   For consistent icon styling across your application's toolbars, wrap a high-level component (like your main `Header` or layout component) with `<IconPresentationProvider size="yourDefaultSize">`.
    *   Custom tool button components can then use the `useIconPresentation` hook to get appropriate class names for icons or a pre-styled `IconContainer`.

    ```diff
    // In your main App.tsx or Header.tsx
    + import { IconPresentationProvider, ToolButton } from '@ohif/ui-next';
    // ...
    + <IconPresentationProvider
    +   size="large" // Or "medium", "small", "tiny", or a number
    +   IconContainer={ToolButton} // Optional: default is Button
    +   containerProps={{ variant: 'primary', className: 'custom-container-class' }} // Optional
    + >
        {/* Your Header content including Toolbars */}
    + </IconPresentationProvider>

    // In a custom tool button using icons
    + import { useIconPresentation, Icons } from '@ohif/ui-next';
    + function MyCustomToolButton({ iconName }) {
    +   const { className: iconClassName } = useIconPresentation();
    +   return <button><Icons.ByName name={iconName} className={iconClassName} /></button>;
    + }
    ```

5.  **Remove Legacy Component Usage:**
    *   Replace any usage of `ToolbarSplitButtonWithServicesLegacy` and `ToolbarButtonGroupWithServicesLegacy` with the newer patterns, typically by configuring individual buttons and using `ToolButtonList` or `ButtonGroup` from `@ohif/ui-next` directly, driven by `useToolbar`.
