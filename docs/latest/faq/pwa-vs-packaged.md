# PWA vs Packaged

It's important to know that the OHIF Viewer project provides two different build
processes:

```bash
# Static Asset output: For deploying PWAs
yarn run build

# Single `.js` script, for embedding viewer into existing apps
yarn run build:package
```

## Progressive Web Application (PWA)

> [Progressive Web Apps][pwa] are a new breed of web applications that meet the
> [following requirements][pwa-checklist]. Notably, targeting a PWA allows us
> provide a reliable, fast, and engaging experience across different devices and
> network conditions.

The OHIF Viewer is maintained as a [monorepo][monorepo]. We use WebPack to build
the many small static assets that comprise our application. Also generated is an
`index.html` that will serve as an entry point for loading configuration and the
application, as well as a `service-worker` that can intelligently cache files so
that subsequent requests are from the local file system instead of over the
network.

You can read more about this particular strategy in our
[Build for Production Deployment Guide](./../deployment/recipes/build-for-production.md)

## Commonjs Bundle (Packaged Script)

The [@ohif/viewer][viewer-npm] package is built with WebPack to provide a React
component that can be dropped into a larger application. The `OHIFViewer`
component is the entire viewer, configurable via React `props`. This is useful
for including the OHIF Viewer in a larger web application, as the entire
application can be provided via a `<script>` tag with no build process required.

The bundle is not as performant or as optimized as the PWA build. It includes
fonts, styles, and the core extensions. If you find yourself facing performance
issues, you may wish to tweak what's included in this bundle or switch to the
PWA build.

You can read more about this particular strategy in our
[Embedded Viewer Deployment Guide](./../deployment/recipes/embedded-viewer.md)

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[pwa]: https://developers.google.com/web/progressive-web-apps/
[pwa-checklist]: https://developers.google.com/web/progressive-web-apps/checklist
[monorepo]: https://github.com/OHIF/Viewers/issues/768
[viewer-npm]: https://www.npmjs.com/package/@ohif/viewer
<!-- prettier-ignore-end -->
