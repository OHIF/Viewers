Package.describe({
  name: "cornerstone",
  summary: "Cornerstone Web-based Medical Imaging libraries",
  version: '0.0.1'
});

Package.onUse(function (api) {
    api.versionsFrom('1.2.0.2');

    api.use('jquery');

    api.addFiles('client/cornerstone.js', 'client', {bare: true});
    api.addFiles('client/cornerstoneMath.js', 'client', {bare: true});
    api.addFiles('client/cornerstoneTools.js', 'client', {bare: true});
    api.addFiles('client/cornerstoneWADOImageLoader.js', 'client', {bare: true});
    api.addFiles('client/cornerstoneWADORSImageLoader.js', 'client', {bare: true});
    api.addFiles('client/dicomParser.js', 'client', {bare: true});
    api.addFiles('client/hammer.js', 'client', {bare: true});

    api.addFiles('client/hangingProtocol.js', 'client', {bare: true});
    api.addFiles('client/measurementManager.js', 'client', {bare: true});
    api.addFiles('client/measurementManagerExample.js', 'client', {bare: true});

    api.export("cornerstone", 'client');
    api.export("cornerstoneMath", 'client');
    api.export("cornerstoneTools", 'client');
    api.export("cornerstoneWADOImageLoader", 'client');
    api.export("cornerstoneWADORSImageLoader", 'client');
    api.export("dicomParser", 'client');

    api.export("getHangingProtocol", 'client');
    api.export("setHangingProtocol", 'client');
});

