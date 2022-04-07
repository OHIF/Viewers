# Embedded Viewer

The quickest and easiest way to get the OHIF Viewer up and running is to embed
it into an existing web application. It allows us to forego a "build step", and
add a powerful medical imaging viewer to an existing web page using only a few
include tags. Here's how it works:

{% include "./../_embedded-viewer-diagram.md" %}

1. Create a new web page or template that includes the following external
   dependencies:

<ul>
  <li>
    <a href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700&display=swap">
      <code>Google Font: Roboto</code>
    </a>
  </li>
  <li>
    <a href="https://unpkg.com/@ohif/viewer">
      <code>@ohif/viewer@latest</code>
    </a>
  </li>
</ul>

<ol start="2">
  <li>Create a JS Object or Function to hold the OHIF Viewer's configuration. Here are some
   example values that would allow the viewer to hit our public PACS:</li>
</ol>

```js
// Set before importing `ohif-viewer` (JS Object)
window.config = {
  // default: '/'
  routerBasename: '/',
  servers: {
    dicomWeb: [
      {
        name: 'DCM4CHEE',
        wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    ],
  },
};
```

To learn more about how you can configure the OHIF Viewer, check out our
[Configuration Guide](../../configuring/index.md).

<ol start="3"><li>
  Render the viewer in the web page's target <code>div</code>
</li></ol>

```js
// Made available by the `@ohif/viewer` script included in step 1
var containerId = 'id-of-div-to-render-component-to';
var componentRenderedOrUpdatedCallback = function() {
  console.log('OHIF Viewer rendered/updated');
};
window.OHIFViewer.installViewer(
  window.config,
  containerId,
  componentRenderedOrUpdatedCallback
);
```

You can see a live example of this recipe in [this CodeSandbox][code-sandbox].

## Add Extensions

The UMD build of the OHIF Viewer is a "light weight" build that only contains
the core extensions required for basic 2D image viewing. It's possible to add
other extensions at runtime.

This only requires us to include a single script tag, and add it using the
`extensions` key to our config. In this practical example, we register our
popular whole slide microscopy extension:

```html
<script
  src="https://unpkg.com/@ohif/extension-dicom-microscopy@0.50.5/dist/index.umd.js"
  crossorigin
></script>

<!-- --->
<script>
  window.config = {
    // ...
    extensions: [OHIFExtDicomMicroscopy],
  };
</script>
```

You can see an example of a slide microscopy study in the viewer [with the
extension enabled here][whole-slide-ext-demo] ([source code][ext-code-sandbox])
and [without it here][whole-slide-base-demo] ([source code][code-sandbox]).

You can read more about extensions and how to create your own in our
[extensions guide](/extensions/index.md).

#### FAQ

> I'm having trouble getting this to work. Where can I go for help?

First, check out this fully functional [CodeSandbox][code-sandbox] example. If
you're still having trouble, feel free to search or GitHub issues. Can't find
anything related your problem? Create a new one.

> My application's styles are impacting the OHIF Viewer's look and feel. What
> can I do?

When you include stylesheets and scripts, they are added globally. This has the
potential of causing conflicts with other scripts and styles on the page. To
prevent this, `embed` the viewer in a new/empty web page. Have that working?
Good. Now `embed` that new page using an
[`<iframe>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe).

This should produce the expected result while also protecting your page from any
globally defined styles/scripts.

> We're trying to embed the OHIF Viewer into an existing React App, but seeing
> react-dom and react conflicts. What can we do?

If you are installing OHIF viewer inside another react app, you may use `installViewer` as follows:
```
import { installViewer } from '@ohif/viewer'

const ohifViewerConfig = window.config // or set it here
const containerId = 'ohif'
const componentRenderedOrUpdatedCallback = function() {
    console.log('OHIF Viewer rendered/updated');
};

componentDidMount() {
   installViewer(
      ohifViewerConfig,
      containerId,
      componentRenderedOrUpdatedCallback
    );
}

render () {
   ...
   //you can render in any element you wish
   <AnyTag id={containerId}/>
}

```

`installViewer` is a convenience method that pulls in some dependencies that may
not be compatible with existing `react` apps. `@ohif/viewer` also exports `App`
which is a react component that takes the `configuration` outlined above as
props. You can use it as a reusable component, and to avoid `react` version
conflict issues.


<!--
  LINKS
  -->

<!-- prettier-ignore-start -->
[code-sandbox]: https://codesandbox.io/s/viewer-script-tag-tprch
[whole-slide-base-demo]: https://tprch.csb.app/viewer/1.2.392.200140.2.1.1.1.2.799008771.2020.1519719354.757
[ext-code-sandbox]: https://codesandbox.io/s/viewer-script-tag-microscopy-extension-44unk
[whole-slide-ext-demo]: https://44unk.csb.app/viewer/1.2.392.200140.2.1.1.1.2.799008771.2448.1519719572.518
<!-- prettier-ignore-end -->
