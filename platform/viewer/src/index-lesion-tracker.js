/**
 * Entry point for development and production PWA builds.
 * Packaged (NPM) builds go through `index-umd.js`
 */

import 'regenerator-runtime/runtime';

import App from './App.js';
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * EXTENSIONS
 * =================
 *
 * Importing and modifying the extensions our app uses HERE allows us to leverage
 * tree shaking and a few other niceties. However, by including them here they become
 * "baked in" to the published application.
 *
 * Depending on your use case/needs, you may want to consider not adding any extensions
 * by default HERE, and instead provide them via the extensions configuration key or
 * by using the exported `App` component, and passing in your extensions as props using
 * the defaultExtensions property.
 */
import OHIFLesionTrackerExtension from '@ohif/extension-lesion-tracker';
import OHIFDicomPDFExtension from '@ohif/extension-dicom-pdf';

/*
 * Default Settings
 */
let config = {};

if (window) {
  config = window.config || {};
}

const appProps = {
  config,
  defaultExtensions: [OHIFLesionTrackerExtension, OHIFDicomPDFExtension],
};

/** Create App */
const app = React.createElement(App, appProps, null);

/** Render */
ReactDOM.render(app, document.getElementById('root'));
