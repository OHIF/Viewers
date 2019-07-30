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
    <a href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
      <code>bootstrap@3.3.7</code>
    </a>
  </li>
  <li>
    <a href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700|Sanchez&display=swap">
      <code>Google Fonts, Sanchez & Roboto</code>
    </a>
  </li>
  <li>
    <a href="https://unpkg.com/react@16/umd/react.production.min.js">
      <code>react@16.8.6</code>
    </a>
  </li>
  <li>
    <a href="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js">
      <code>react-dom@16.8.6</code>
    </a>
  </li>
  <li>
    <a href="https://unpkg.com/ohif-viewer/dist/index.umd.js">
      <code>ohif-viewer@latest</code>
    </a>
  </li>
</ul>

<ol start="2">
  <li>The <a href="">WADO Image Loader Codecs and Web Worker source code</a>
  should be accessible from your server's root</li>
  <li>Create a JS Object to hold the OHIF Viewer's configuration. Here are some
   example values that would allow the viewer to hit our public PACS:</li>
</ol>

```js
// Set before importing `ohif-viewer`
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
        requestOptions: {
          requestFromBrowser: true,
        },
      },
    ],
  },
};
```

<ol start="5"><li>
  Render the viewer in the web page's target <code>div</code>
</li></ol>

```js
// Made available by the `ohif-viewer` script included in step 1
var Viewer = window.OHIFStandaloneViewer.App;
var app = React.createElement(Viewer, window.config, null);

ReactDOM.render(app, document.getElementById('ohif-viewer-target'));
```

#### Tips & Tricks

> I'm having trouble getting this to work. Where can I go for help?

First, check out this fully functional [CodeSandbox][code-sandbox] example. If
you're still having trouble, feel free to search or GitHub issues. Can't find
anything related your problem? Create a new one.

> When I include bootstrap, other styles on my page no longer work correctly.
> What can I do?

When we include `bootsrap` (and the other dependencies), they are added
globally. This has the potential of causing conflicts with other scripts and
styles on the page. To prevent this, `embed` the viewer in a new/empty web page.
Have that working? Good. Now `embed` that new page using an
[`<iframe>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe).

This should produce the expected result while also protecting your page from any
globally defined styles/scripts.

[code-sandbox]: https://codesandbox.io/s/ohif-viewer-script-tag-usage-b3st9
