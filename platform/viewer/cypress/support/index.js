// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands';

Cypress.on('window:before:load', window => {
  //
  // window.addEventListener('load', evt => {
  //   _injectStyles(
  //     '.hide-canvas-offscreen { position: absolute; right: 50000px; }'
  //   );
  // });

  // Override our `getContext` function so all contexts that are webGl are
  // Created with `preserveDrawingBuffer = true`; this is required for percy
  // Snapshot
  window.HTMLCanvasElement.prototype.getContext = (function(oldGetContextFn) {
    return function(type, attrs) {
      attrs = attrs || {};
      if (
        type === 'webgl' ||
        type === 'webgl2' ||
        type === 'experimental-webgl'
      ) {
        attrs.preserveDrawingBuffer = true;
      }
      return oldGetContextFn.apply(this, [type, attrs]);
    };
  })(HTMLCanvasElement.prototype.getContext);
});

// Originally used to fix VTK canvas screenshot issue; but canvas's will stay
// hidden until interacted with :+1:
// Keeping here as a reference for injecting styles at runtime
// function _injectStyles(rule) {
//   var body = document.querySelector('body');
//   console.log(body);
//   var div = document.createElement('div');
//   div.innerHTML = '&shy;&lt;style&gt;' + rule + '&lt;/style&gt;';

//   body.appendChild(div);
// }
