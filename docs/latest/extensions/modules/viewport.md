# Module: Viewport

An extension can register a Viewport Module by providing a `getViewportModule()`
method that returns a React Component. The React component will receive the
following props:

```js
children: PropTypes.arrayOf(PropTypes.element)
studies: PropTypes.object,
displaySet: PropTypes.object,
viewportData: PropTypes.object, // { studies, displaySet }
viewportIndex: PropTypes.number,
children: PropTypes.node,
customProps: PropTypes.object
```

Viewport components are managed by the `ViewportGrid` Component. Which Viewport
component is used depends on:

- The Layout Configuration
- Registered SopClassHandlers
- The SopClassUID for visible/selected datasets

![Cornerstone Viewport](../../assets/img/extensions-viewport.png)

<center><i>An example of three Viewports</i></center>

For a complete example implementation,
[check out the OHIFCornerstoneViewport](https://github.com/OHIF/Viewers/blob/master/extensions/cornerstone/src/OHIFCornerstoneViewport.js).
