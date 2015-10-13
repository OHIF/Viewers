Package.describe({
  name: "dicomweb",
  summary: "DICOM Web Helper Functions",
  version: '0.0.1'
});

Package.onUse(function (api) {
    api.addFiles('server/namespace.js', 'server');
    api.addFiles('server/getImageFrame.js', 'server');
    api.addFiles('server/getJSON.js', 'server');
    api.addFiles('server/getName.js', 'server');
    api.addFiles('server/getNumber.js', 'server');
    api.addFiles('server/getString.js', 'server');

    api.export("DICOMWeb", 'server');
});

