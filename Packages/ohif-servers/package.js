Package.describe({
    name: 'ohif:servers',
    summary: 'OHIF collections to manage DICOM server information',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('templating');
    api.use('jquery');
    api.use('stylus');
    api.use('aldeed:simple-schema');
    api.use('aldeed:collection2');

    // Our custom packages
    api.use('ohif:core');
    api.use('ohif:log');

    // Client and server imports
    api.addFiles('both/index.js', [ 'client', 'server' ]);

    // Server imports
    api.addFiles('server/index.js', 'server');

    // Client imports
    api.addFiles('client/index.js', 'client');
});
