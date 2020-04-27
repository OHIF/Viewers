/**
 * Entry point for development and production PWA builds.
 * Packaged (NPM) builds go through `index-umd.js`
 */

import 'regenerator-runtime/runtime';

import App from './App.js';
import React from 'react';
import ReactDOM from 'react-dom';

const appProps = {};

/** Create App */
const app = React.createElement(App, appProps, null);

/** Render */
ReactDOM.render(app, document.getElementById('root'));
