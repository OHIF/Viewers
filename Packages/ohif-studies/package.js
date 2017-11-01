Package.describe({
    name: 'ohif:studies',
    summary: 'OHIF Studies Library to deal with studies UI, retrieval and manipulation',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use([
        'ecmascript',
        'templating',
        'stylus',
        'http'
    ]);

    // Our custom packages
    api.use([
        'ohif:design',
        'ohif:core',
        'ohif:log',
        'ohif:servers',
        'ohif:dicom-services',
        'ohif:viewerbase',
        'ohif:wadoproxy'
    ]);

    // Client and server imports
    api.addFiles('both/main.js', [ 'client', 'server' ]);

    // Server imports
    api.addFiles('server/main.js', 'server');

    // Client imports
    api.addFiles('client/main.js', 'client');
});
