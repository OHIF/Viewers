Package.describe({
    name: 'ohif:lesiontracker',
    summary: 'OHIF Lesion Tracker Tools',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('random');

    api.use('validatejs');

    // Template overriding
    api.use('aldeed:template-extension@4.0.0');

    // Our custom packages
    api.use('ohif:design');
    api.use('ohif:core');
    api.use('ohif:study-list');
    api.use('ohif:cornerstone');
    api.use('ohif:measurements');

    api.addFiles('both/index.js', [ 'client', 'server' ]);

    api.addFiles('server/index.js', 'server');

    api.addFiles('client/index.js', 'client');

    // Export global functions
    api.export('convertNonTarget', 'client');

    // Export client-side collections
    api.export('ValidationErrors', 'client');
    api.export('LesionLocations', 'client');
    api.export('LocationResponses', 'client');

    // Export collections spanning both client and server
    api.export('Configuration', ['client', 'server']);
});
