Package.describe({
    name: 'ohif:measurement-table',
    summary: 'OHIF Measurement table',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.6');

    api.use('ecmascript');

    // Our custom packages
    api.use('ohif:cornerstone');
    api.use('ohif:core');
    api.use('ohif:cornerstone-settings');
    api.use('ohif:viewerbase');
    api.use('ohif:studies');
    api.use('ohif:measurements');

    api.addFiles('client/index.js', 'client');
});
