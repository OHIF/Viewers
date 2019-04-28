# Deployment

The OHIF Viewer can be embedded in other web applications via it's [packaged
script source][ohif-viewer-npm], or served up as a stand-alone PWA ([progressive
web application][pwa-url]) by building and hosting a collection of static
assets. In either case, you will need to configure your instance of the Viewer
so that it can connect to your data source (the database or PACS that provides
the data your Viewer will display).

## Overview

Our goal is to make deployment as simple and painless as possible; however,
there is an inherent amount of complexity in customizing, optimizing, and
deploying web applications. If you find yourself a little lost, please don't
hesitate to [reach out for help](/help.md)

## Deployment Scenarios

### Embedded Viewer

The quickest and easiest way to get the OHIF Viewer up and running is to embed
it into an existing web application. It allows us to forego a "build step", and
add a powerful medical imaging viewer to an existing web page using only a few
include tags.

- Read more about it here: [Embedded Viewer](./recipes/embedded-viewer.md)
- And check out our
  [live demo on CodeSandbox](https://codesandbox.io/s/lrjoo3znxm)

{% include "./_embedded-viewer-diagram.md" %}

### Stand-alone Viewer

Deploying the OHIF Viewer as a stand-alone web application provides many
benefits, but comes at the cost of time and complexity. Some benefits include:

_Today:_

- Leverage [extensions](/advanced/extensions.md) to drop-in powerful new
  features
- Add routes and customize the viewer's workflow
- Finer control over styling and whitelabeling

_In the future:_

- The ability to package the viewer for [App Store distribution][app-store]
- Leverage `service-workers` for offline support and speed benefits from caching

#### Hosted Static Assets

...

#### Docker

...

## Data

### Securing your data

<!--
  Links
  -->

<!-- prettier-ignore-start -->

[ohif-viewer-npm]: https://www.npmjs.com/package/ohif-viewer
[pwa-url]: https://developers.google.com/web/progressive-web-apps/
[static-assets-url]: https://www.maxcdn.com/one/visual-glossary/static-content/
[app-store]: https://medium.freecodecamp.org/i-built-a-pwa-and-published-it-in-3-app-stores-heres-what-i-learned-7cb3f56daf9b

<!-- prettier-ignore-end -->
