# Architecture

The ohif-viewer package provides two different build processes:

# create-react-app

> [create-react-app](https://github.com/facebook/create-react-app) provides pre-configured build process for developing front-end applications with [React](https://reactjs.org/).

The ohif-viewer package can be run as a create-react-app application. This is useful for development, debugging, or evolving ohif-viewer into your own custom imaging application.

# Rollup

> [Rollup](https://rollupjs.org/guide/en) is a module bundler for JavaScript. It uses the new standardized format for code modules included in the ES6 revision of JavaScript.

The ohif-viewer package can be built with Rollup to provide a set of React components which can be dropped into a larger application. Specifically, the ohif-viewer package provides a React component named `OHIFViewer` which is the entire viewer, configurable via React `props`. This is useful for including the OHIF Viewer in a larger web application, as the entire application can be provided via a `<script>` tag with no build process required.
