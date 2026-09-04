// https://jestjs.io/docs/en/webpack#handling-static-assets
//
// The shared jest config maps every static asset here. This package had no copy
// of it, so any test that reached a component importing an image - the Icons
// barrel imports the window level preset thumbnails - failed to resolve.

module.exports = 'test-file-stub';
