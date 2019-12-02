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
 * You may want to consider not adding any extensions
 * by default HERE, and instead provide them via the configuration specified at
 * `window.config.extensions`, or by using the exported `App` component, and passing
 * in your extensions as props.
 */

// Default Settings
let config = {};
const appDefaults = {
  routerBasename: '/',
};

if (window) {
  config = window.config || {};
}

const appProps = Object.assign({}, appDefaults, { config });

// Create App
const app = React.createElement(App, appProps, null);

// Render
ReactDOM.render(app, document.getElementById('root'));
