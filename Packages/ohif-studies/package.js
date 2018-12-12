Package.describe({
    name: 'ohif:studies',
    summary: 'OHIF Studies Library to deal with studies UI, retrieval and manipulation',
    version: '0.0.1'
});

Npm.depends({
    dimse: '0.0.2',
    'dicomweb-client': '0.3.2',
    'xhr2': '0.1.4'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use([
        'ecmascript',
        'templating',
        'stylus',
        'http'
    ]);

    // Our custom packages
    api.use([
        'ohif:core',
        'ohif:viewerbase',
    ]);

    // Client imports
    api.addFiles('client/main.js', 'client');
});
