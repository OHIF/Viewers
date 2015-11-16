Package.describe({
  name: "dicomweb",
  summary: "DICOM Web Helper Functions",
  version: '0.0.1'
});

Package.onUse(function (api) {
    api.use('http');

    // DICOMWeb API functions
    api.addFiles('server/namespace.js', 'server');
    api.addFiles('server/getImageFrame.js', 'server');
    api.addFiles('server/getJSON.js', 'server');
    api.addFiles('server/getName.js', 'server');
    api.addFiles('server/getNumber.js', 'server');
    api.addFiles('server/getString.js', 'server');

    // Helper functions
    api.addFiles('lib/findIndexOfString.js', 'server');
    api.addFiles('lib/uint8ArrayToString.js', 'server');

    api.export("DICOMWeb", 'server');
});

