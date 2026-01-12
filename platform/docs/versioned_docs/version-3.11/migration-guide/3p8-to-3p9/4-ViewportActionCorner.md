---
id: viewport-action-corner
title: ViewportActionCorner
summary: Migration guide for ViewportActionCornerService in OHIF 3.9, introducing the new addComponent and addComponents methods that provide more reliable positioning of multiple components within viewport corners.
---




## Key Changes and Rationale

Previously, the `ViewportActionCornersService` used the `setComponent` or `setComponents` methods to add components to viewport corners. These methods, when used with multiple components, would essentially overwrite existing components at the same location, unless great care was taken with the `indexPriority` property. This made it difficult to reliably position multiple components within the same corner.

The new approach introduces the methods `addComponent` and `addComponents`, which insert components into the viewport corners based on an optional `indexPriority` property and provide predictable ordering based on the relative `indexPriority` of the components already at the corner. If no `indexPriority` is given, components are added to the end (for the left side) or the beginning (for the right side) by default.

### Migration Steps

**Update Component Addition Methods:** Replace calls to `setComponent` and `setComponents` with `addComponent` and `addComponents`, respectively.

```js
// Old API
viewportActionCornersService.setComponent({
  viewportId,
  id: 'myComponent',
  component: <MyComponent />,
  location: viewportActionCornersService.LOCATIONS.topRight
});
```

**New API**

```js
viewportActionCornersService.addComponent({
  viewportId,
  id: 'myComponent',
  component: <MyComponent />,
  location: viewportActionCornersService.LOCATIONS.topRight,
  indexPriority: 1, // indexPriority is now optional and determines placement order within the corner
});

```
