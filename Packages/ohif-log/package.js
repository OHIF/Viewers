Package.describe({
    name: 'ohif:log',
    summary: 'OHIF Logging',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('standard-app-packages');

    // Control over logging
    api.use('practicalmeteor:loglevel');

    // Our custom packages
    api.use('ohif:core');

    api.addFiles('main.js', [ 'client', 'server' ]);
});
