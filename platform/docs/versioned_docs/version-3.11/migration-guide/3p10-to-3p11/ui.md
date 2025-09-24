---
sidebar_position: 5
sidebar_label: UI
summary: Migration guide for OHIF 3.11's UI changes, including the transition from `ViewportActionCornersService` to `ToolbarService` and the introduction of `useToolbar` hook.
---


## New useIconPresentation hook

This section details the introduction of the `IconPresentationProvider` and `useIconPresentation` hook, offering an optional way to manage icon size and container styling within the UI.

### Key Changes:

*   **New Context and Hook:** Introduction of `IconPresentationProvider` and `useIconPresentation` to provide a standardized way to control the size and potentially the container component/props for icons and related interactive elements (like `ToolButton`).

### Migration Steps:

Using the `IconPresentationProvider` is **entirely optional**. If you do not wrap your components with this provider, components like `ToolButton` will continue to use their explicit `size` prop and default styling.

However, if you wish to centrally manage the presentation of icons within a specific part of your application's component tree, follow these steps:

1.  **Identify the component subtree:** Determine which section of your UI you want to apply consistent icon styling to.

2.  **Wrap with `IconPresentationProvider`:** Wrap the root of that component subtree with the `IconPresentationProvider`. Pass the desired `size` prop. You can also optionally provide a custom `IconContainer` component and `containerProps` if you want to change the wrapper around the icon itself (e.g., switching from a `Button` to a `ToolButton` or applying specific styling).

    ```jsx
    import { IconPresentationProvider, ToolButton } from '@ohif/ui-next';

    function MyComponentTree() {
      return (
        // Icons and ToolButtons within this provider will inherit 'large' size
        <IconPresentationProvider size="large">
          {/* Any components inside that consume the context */}
          <ToolButton id="myTool" icon="Circle" tooltip="Draw Circle" />
          {/* ... other components ... */}
        </IconPresentationProvider>
      );
    }
    ```

3.  **Consume the context in components (if building custom components):** If you are building a custom component that renders an icon and want it to respect the provider's settings, use the `useIconPresentation` hook within that component. This hook provides the configured size, a calculated CSS class name (`className`), the specified `IconContainer` component, and its `containerProps`.

    ```jsx
    import React from 'react';
    import { useIconPresentation, Icons } from '@ohif/ui-next';

    function MyCustomIconButton({ iconName, ...rest }) {
      // This hook reads the nearest IconPresentationProvider context
      const { className, IconContainer, containerProps } = useIconPresentation();

      // Use the provided IconContainer and its props
      return (
        <IconContainer {...rest} {...containerProps}>
          {/* Use the calculated className for the icon */}
          <Icons.ByName name={iconName} className={className} />
        </IconContainer>
      );
    }
    ```
    *Note: Built-in components like `ToolButton` in `@ohif/ui-next` have been updated internally to consume this context automatically if a provider is available.*
