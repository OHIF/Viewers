---
sidebar_position: 5
sidebar_label: Viewport
---

# Module: Viewport

## Overview

Viewports consume a displaySet and display/allow the user to interact with data.
An extension can register a Viewport Module by defining a `getViewportModule`
method that returns a React component. Currently, we use viewport components to
add support for:

- 2D Medical Image Viewing (cornerstone ext.)
- Structured Reports as SR (DICOM SR ext.)
- Encapsulated PDFs as PDFs (DICOM pdf ext.)

The general pattern is that a mode can define which `Viewport` to use for which
specific `SOPClassHandlerUID`, so if you want to fork just a single Viewport
component for a specialized mode, this is possible.

```jsx
// displaySet, dataSource
const getViewportModule = () => {
  const wrappedViewport = props => {
    return (
      <ExampleViewport
        {...props}
        onEvent={data => {
          commandsManager.runCommand('commandName', data);
        }}
      />
    );
  };

  return [{ name: 'example', component: wrappedViewport }];
};
```

## Example Viewport Component

A simplified version of the tracked `OHIFCornerstoneViewport` is shown below, which
creates a cornerstone viewport:


```jsx
function TrackedCornerstoneViewport({
  children,
  dataSource,
  displaySets,
  viewportId,
  servicesManager,
  extensionManager,
  commandsManager,
}) {

  return (
    <div className="viewport-wrapper">
      /** Resize Detector */
      <ReactResizeDetector
        handleWidth
        handleHeight
        skipOnMount={true} // Todo: make these configurable
        refreshMode={'debounce'}
        refreshRate={100}
        onResize={onResize}
        targetRef={elementRef.current}
      />
      /** Div For displaying image */
      <div
        className="cornerstone-viewport-element"
        style={{ height: '100%', width: '100%' }}
        onContextMenu={e => e.preventDefault()}
        onMouseDown={e => e.preventDefault()}
        ref={elementRef}
      ></div>
    </div>
  );
}
```

### Viewport re-rendering optimizations

We make use of the React memoization pattern to prevent unnecessary re-renders
for the viewport unless certain aspects of the Viewport props change. You can take
a look into the `areEqual` function in the `OHIFCornerstoneViewport` component to
see how this is done.

```js
function areEqual(prevProps, nextProps) {
  if (prevProps.displaySets.length !== nextProps.displaySets.length) {
    return false;
  }

  if (
    prevProps.viewportOptions.orientation !==
    nextProps.viewportOptions.orientation
  ) {
    return false;
  }

  // rest of the code
```

as you see, we check if the `needsRerendering` prop is true, and if so, we will
re-render the viewport if the `displaySets` prop changes or the orientation
changes.


We use viewportId to identify a viewport and we use it as a key in React
rendering. This is important because it allows us to keep track of the viewport
and its state, and also let React optimize and move the viewport around in the
grid without re-rendering it. However, there are some cases where we need to
force re-render the viewport, for example, when the viewport is hydrated
with a new Segmentation. For these cases, we use the `needsRerendering` prop
to force re-render the viewport. You can add it to the `viewportOptions`





### `@ohif/app`

Viewport components are managed by the `ViewportGrid` Component. Which Viewport
component is used depends on:

- Hanging Protocols
- The Layout Configuration
- Registered SopClassHandlers

![viewportModule-layout](../../../assets/img/viewportModule-layout.png)

<center><i>An example of three cornerstone Viewports</i></center>
