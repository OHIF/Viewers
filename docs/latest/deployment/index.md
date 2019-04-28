# Deployment

The OHIF Viewer can be embedded in other web applications via it's [packaged
script source][ohif-viewer-npm], or as a standalone PWA ([progressive web
application][pwa-url] by building and hosting a collection of static assets. In
either case, you will need to configure your instance of the Viewer so that it
can connect to your data source (the database or PACS that provides the data
your Viewer will display). Let's unpack that a little:

## Overview

The OHIF Viewer is a tool. It

## Deployment Scenarios

### Embedded Viewer

The quickest and easiest way to get the OHIF Viewer up and running is to embed
it into an existing web application.

<div style="text-align: center;">
  <img src="/assets/img/embedded-viewer-diagram.png" alt="Embedded Viewer Diagram" style="margin: 0 auto;" />
  <i>embedded viewer diagram</i>
</div>

1. Create a new web page or template that includes the following external
   dependencies:

<ul>
  <li>
    <a href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
      <code>bootstrap@3.3.7</code>
    </a>
  </li>
  <li>
    <a href="https://fonts.googleapis.com/css?family=Sanchez">
      <code>Google Font @ Sanchez</code>
    </a>
  </li>
  <li>
    <a href="https://use.fontawesome.com/releases/v5.7.2/css/all.css">
      <code>fontawesome@5.7.2</code>
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

<ol start="2"><li>Create a JS Object to hold the OHIF Viewer's configuration. Here are some
   example values that would allow the viewer to hit our public PACS:</li></ol>

```js
var props = {
  routerBasename: '/',
  rootUrl: 'https://lrjoo3znxm.codesandbox.io',
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
}
```

<ol start="3"><li>
  Render the viewer in the web page's target <code>div</code>
</li></ol>

```js
// Made available by the `ohif-viewer` script included in step 1
var Viewer = window.OHIFStandaloneViewer.App
var app = React.createElement(Viewer, props, null)

ReactDOM.render(app, document.getElementById('ohif-viewer-target'))
```

#### Tips & Tricks

> I'm having trouble getting this to work. Where can I go for help?

First, check out this fully functional
[CodeSandbox](https://codesandbox.io/s/lrjoo3znxm) example. If you're still
having trouble, feel free to search or GitHub issues. Can't find anything
related your problem? Create a new one.

> When I include bootstrap, other styles on my page no longer work correctly.
> What can I do?

When we include `bootsrap` (and the other dependencies), they are added
globally. This has the potential of causing conflicts with other scripts and
styles on the page. To prevent this, `embed` the viewer in a new/empty web page.
Have that working? Good. Now `embed` that new page using an
[`<iframe>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe).

This should produce the expected result while also protecting your page from any
globally defined styles/scripts.

### PWA Built From Source

...

## Gotchas

## Next Steps

### Securing your data

<!--
  Links
  -->

[ohif-viewer-npm]: https://www.npmjs.com/package/ohif-viewer
[pwa-url]: https://developers.google.com/web/progressive-web-apps/
[static-assets-url]: https://www.maxcdn.com/one/visual-glossary/static-content/

```

```
