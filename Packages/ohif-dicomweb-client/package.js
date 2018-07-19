Package.describe({
    name: 'ohif:dicomweb-client',
    summary: 'DICOM Services: DICOMWeb',
    version: '0.0.1'
});

Npm.depends({
    'url-parse': '1.4.1',
    'isomorphic-fetch': '2.2.1',
    'isomorphic-base64': '1.0.2'
});

Package.onUse(function(api) {
    api.versionsFrom('1.6');

    api.use('ecmascript');

    // DICOMWeb functions
    api.mainModule('src/index.js');

    api.export('DICOMWeb');
});
