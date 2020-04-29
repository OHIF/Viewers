/**
 * Entry point for development and production PWA builds.
 * Packaged (NPM) builds go through `index-umd.js`
 */
import 'regenerator-runtime/runtime';
import App from './App.js';
import React from 'react';
import ReactDOM from 'react-dom';

/** Combine our appConfiguration and "baked-in" extensions */
const appProps = {
  config: window ? window.config : {},
  defaultExtensions: [],
};

/** Create App */
const app = React.createElement(App, appProps, null);

/** Render */
ReactDOM.render(app, document.getElementById('root'));
