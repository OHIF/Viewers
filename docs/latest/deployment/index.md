# Deployment

The OHIF Viewer can be embedded in other web applications via it's [packaged
script source][ohif-viewer-npm], or served up as a stand-alone PWA ([progressive
web application][pwa-url] by building and hosting a collection of static assets.
In either case, you will need to configure your instance of the Viewer so that
it can connect to your data source (the database or PACS that provides the data
your Viewer will display). Let's unpack that a little:

## Overview

Our goal is to make deployment as simple and painless as possible; however,
there is an inherent amount of complexity in customizing, optimizing, and
deploying web applications. If

## Deployment Scenarios

### Embedded Viewer

The quickest and easiest way to get the OHIF Viewer up and running is to embed
it into an existing web application. It allows us to forego a "build step", and
add a powerful medical imaging viewer to an existing web page using only a few
include tags.

- Read more about it here: [Embedded Viewer](/deployment/embedded-viewer.html)
- And check out our
  [live demo on CodeSandbox](https://codesandbox.io/s/lrjoo3znxm)

{% include "./_embedded-viewer-diagram.md" %}

### Stand-alone Viewer

Deploying the OHIF Viewer as a stand-alone web application provides many
benefits, but comes at the cost of time and complexity.

#### Hosted Static Assets

...

#### Docker

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
