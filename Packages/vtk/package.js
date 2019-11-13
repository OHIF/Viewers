Package.describe({
    name: 'gtajesgenga:vtk',
    summary: 'Collections to manage VTK pipelines information',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('METEOR@1.6');

    api.use('ecmascript');
    api.use('templating');
    api.use('jquery');
    api.use('stylus');
    api.use('aldeed:simple-schema');
    api.use('aldeed:collection2');
    api.use('sergeyt:typeahead');

    // Client and server imports
    api.addFiles('both/index.js', [ 'client', 'server' ]);

    // Server imports
    api.addFiles('server/index.js', 'server');

    // Client imports
    api.addFiles('client/index.js', 'client');
});
