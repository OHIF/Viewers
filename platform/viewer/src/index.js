/**
 * Entry point for development and production PWA builds.
 * Packaged (NPM) builds go through `index_publish.js`
 */
import App from './App.js';
import React from 'react';
import ReactDOM from 'react-dom';

// EXTENSIONS
import OHIFVTKExtension from '@ohif/extension-vtk';
import OHIFDicomHtmlExtension from '@ohif/extension-dicom-html';
import OHIFDicomMicroscopyExtension from '@ohif/extension-dicom-microscopy';
import OHIFDicomPDFExtension from '@ohif/extension-dicom-pdf';

// Default Settings
window.config = window.config || {};
window.config.extensions = [OHIFVTKExtension];

const appDefaults = {
  routerBasename: '/',
  relativeWebWorkerScriptsPath: '',
};
const appProps = Object.assign({}, appDefaults, window.config);

// Create App
const app = React.createElement(App, appProps, null);

// Render
ReactDOM.render(app, document.getElementById('root'));
