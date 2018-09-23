Package.describe({
    name: 'ohif:log',
    summary: 'OHIF Logging',
    version: '0.0.1'
});

Npm.depends({
    loglevel: '1.4.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');
    api.use('standard-app-packages');

    // Our custom packages
    api.use('ohif:core');

    api.addFiles('main.js', [ 'client', 'server' ]);
});
