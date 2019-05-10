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

At the end of the day, a production OHIF Viewer instance is a collection of
HTML, CSS, JS, Font Files, and Images. We "build" those files from our
`source code` with configuration specific to our project. We then make those
files publicly accessible by hosting them on a Web Server.

If you have not deployed a web application before, this may be a good time to
[reach out for help](/help.md), as these steps assume prior web development and
deployment experience.

##### Part 1 - Build Production Assets

"Building", or creating, the files you will need is the same regardless of the
web host you choose. You can find detailed instructions on how to configure and
build the OHIF Viewer in our
["Build for Production" guide](./recipes/build-for-production.md).

##### Part 2 - Host Your App

There are a lot of [benefits to hosting static assets][host-static-assets] over
dynamic content. You can find instructions on how to host your build's output
via one of these guides:

_Drag-n-drop_

- [Netlify: Drop](/deployment/recipes/static-assets.md#netlify-drop)

_Easy_

- [Surge.sh](/deployment/recipes/static-assets.md#surgesh)
- [GitHub Pages](/deployment/recipes/static-assets.md#github-pages)

_Advanced_

- [AWS S3 + Cloudfront](/deployment/recipes/static-assets.md#aws-s3--cloudfront)
- [GCP + Cloudflare](/deployment/recipes/static-assets.md#gcp--cloudflare)
- [Azure](/deployment/recipes/static-assets.md#azure)

## Data

The OHIF Viewer is able to connect to any data source that implements the [DICOM
Web Standard][dicom-web-standard]. [DICOM Web][dicom-web] refers to RESTful
DICOM Services -- a recently standardized set of guidelines for exchanging
medical images and imaging metadata over the internet. Not all archives fully
support it yet, but it is gaining wider adoption.

### Configure Connection

If you have an existing archive and intend to host the OHIF Viewer at the same
domain name as your archive, then connecting the two is as simple as following
the steps layed out in our
[Configuration Essentials Guide](./../essentials/configuration.md).

### What if I don't have an imaging archive?

...

#### Making sure your archive is accessible

- CORS
- Proxy (dangers)
- Note: PACS not meant to be directly accesible from Web

#### Securing your data

- Reach out to experts
- Recipes

### What if my archive doesn't support DICOM Web?

- Mapping layer
- GraphQL?

<!--
  Links
  -->

<!-- prettier-ignore-start -->

[ohif-viewer-npm]: https://www.npmjs.com/package/ohif-viewer
[pwa-url]: https://developers.google.com/web/progressive-web-apps/
[static-assets-url]: https://www.maxcdn.com/one/visual-glossary/static-content/
[app-store]: https://medium.freecodecamp.org/i-built-a-pwa-and-published-it-in-3-app-stores-heres-what-i-learned-7cb3f56daf9b
[dicom-web-standard]: https://www.dicomstandard.org/dicomweb/
[dicom-web]: https://en.wikipedia.org/wiki/DICOMweb
[host-static-assets]: https://www.netlify.com/blog/2016/05/18/9-reasons-your-site-should-be-static/

<!-- prettier-ignore-end -->
