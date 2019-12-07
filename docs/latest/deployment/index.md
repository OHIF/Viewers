# Deployment

The OHIF Viewer can be embedded in other web applications via it's [packaged
script source][viewer-npm], or served up as a stand-alone PWA ([progressive web
application][pwa-url]) by building and hosting a collection of static assets. In
either case, you will need to configure your instance of the Viewer so that it
can connect to your data source (the database or PACS that provides the data
your Viewer will display).

## Overview

Our goal is to make deployment as simple and painless as possible; however,
there is an inherent amount of complexity in configuring and deploying web
applications. If you find yourself a little lost, please don't hesitate to
[reach out for help](/help.md)

## Deployment Scenarios

### Embedded Viewer

The quickest and easiest way to get the OHIF Viewer up and running is to embed
it into an existing web application. It allows us to forego a "build step", and
add a powerful medical imaging viewer to an existing web page using only a few
include tags.

- Read more about it here: [Embedded Viewer](./recipes/embedded-viewer.md)
- And check out our [live demo on CodeSandbox][code-sandbox]

{% include "./_embedded-viewer-diagram.md" %}

### Stand-alone Viewer

Deploying the OHIF Viewer as a stand-alone web application provides many
benefits, but comes at the cost of time and complexity. Some benefits include:

_Today:_

- Leverage [extensions](/extensions/index.md) to drop-in powerful new features
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
[Configuration Essentials Guide](./../configuring/index.md).

#### What if I don't have an imaging archive?

We provide some guidance on configuring a local image archive in our
[Data Source Essentials](./../configuring/data-source.md) guide. Hosting an
archive remotely is a little trickier. You can check out some of our
[advanced recipes](#recipes) for modeled setups that may work for you.

#### What if I intend to host the OHIF Viewer at a different domain?

There are two important steps to making sure this setup works:

1. Your Image Archive needs to be exposed, in some way, to the open web. This
   can be directly, or through a `reverse proxy`, but the Viewer needs _some
   way_ to request it's data.
2. \* Your Image Archive needs to have appropriate CORS (Cross-Origin Resource
   Sharing) Headers

> \* Cross-Origin Resource Sharing (CORS) is a mechanism that uses additional
> HTTP headers to tell a browser to let a web application running at one origin
> (domain) have permission to access selected resources from a server at a
> different origin. - [MDN Web Docs: Web - Http - CORS][cors]

Most image archives do not provide either of these features "out of the box".
It's common to use IIS, Nginx, or Apache to route incoming requests and append
appropriate headers. You can find an example of this setup in our
[Nginx + Image Archive Deployment Recipe](deployment/recipes/nginx--image-archive.md).

#### What if my archive doesn't support DicomWeb?

> This is possible to do with the OHIF Viewer, but not as straightforward. Look
> out for documentation on this subject in the near future.

...

### Securing Your Data

> Feeling lost? Securing your data is important, and it can be hard to tell if
> you've gotten it right. Don't hesitate to work with professional auditors, or
> [enlist help from experts](./../help.md).

The OHIF Viewer can be configured to work with authorization servers that
support one or more of the OpenID-Connect authorization flows. The Viewer finds
it's OpenID-Connect settings on the `oidc` configuration key. You can set these
values following the instructions laid out in the
[Configuration Essentials Guide](./../configuring/index.md).

_Example OpenID-Connect Settings:_

```js
window.config = {
  ...
  oidc: [
    {
      // ~ REQUIRED
      // Authorization Server URL
      authority: 'http://127.0.0.1/auth/realms/ohif',
      client_id: 'ohif-viewer',
      redirect_uri: 'http://127.0.0.1/callback', // `OHIFStandaloneViewer.js`
      response_type: 'code', // "Authorization Code Flow"
      scope: 'openid', // email profile openid
      // ~ OPTIONAL
      post_logout_redirect_uri: '/logout-redirect.html',
    },
  ],
}
```

You can find an example of this setup in our
[User Account Control Deployment Recipe](deployment/recipes/user-account-control.md).

#### Choosing a Flow for the Viewer

In general, we recommend using the "Authorization Code Flow" ( [see
`response_type=code` here][code-flows]); however, the "Implicit Flow" ( [see
`response_type=token` here][code-flows]) can work if additonal precautions are
taken. If the flow you've chosen produces a JWT Token, it's validity can be used
to secure access to your Image Archive as well.

### Recipes

We've included a few recipes for common deployment scenarios. There are many,
many possible configurations, so please don't feel limited to these setups.
Please feel free to suggest or contribute your own recipes.

- Script Include
  - [Embedding the Viewer](deployment/recipes/embedded-viewer.md)
- Stand-Alone
  - [Build for Production](deployment/recipes/build-for-production.md)
  - [Static](deployment/recipes/static-assets.md)
  - [Nginx + Image Archive](deployment/recipes/nginx--image-archive.md)
  - [User Account Control](deployment/recipes/user-account-control.md)

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[viewer-npm]: https://www.npmjs.com/package/@ohif/viewer
[pwa-url]: https://developers.google.com/web/progressive-web-apps/
[static-assets-url]: https://www.maxcdn.com/one/visual-glossary/static-content/
[app-store]: https://medium.freecodecamp.org/i-built-a-pwa-and-published-it-in-3-app-stores-heres-what-i-learned-7cb3f56daf9b
[dicom-web-standard]: https://www.dicomstandard.org/dicomweb/
[dicom-web]: https://en.wikipedia.org/wiki/DICOMweb
[host-static-assets]: https://www.netlify.com/blog/2016/05/18/9-reasons-your-site-should-be-static/
[cors]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
[code-flows]: https://medium.com/@darutk/diagrams-of-all-the-openid-connect-flows-6968e3990660
[code-sandbox]: https://codesandbox.io/s/viewer-script-tag-tprch
<!-- prettier-ignore-end -->
