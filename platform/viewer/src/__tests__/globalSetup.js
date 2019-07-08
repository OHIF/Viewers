const _ = require('lodash');
const originalConsoleError = console.error;

// JSDom's CSS Parser has limited support for certain features
// This supresses error warnings caused by it
console.error = function(msg) {
  if (_.startsWith(msg, 'Error: Could not parse CSS stylesheet')) return;
  originalConsoleError(msg);
};
