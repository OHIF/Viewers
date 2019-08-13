/**
 * Entry point index.js for UMD packaging
 */
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.js';

function installViewer(props, containerId = 'root', callback) {
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error(
      "No root element found to install viewer. Please add a <div> with the id 'root', or pass a DOM element into the installViewer function."
    );
  }

  return ReactDOM.render(<App {...props} />, container, callback);
}

export { App, installViewer };
