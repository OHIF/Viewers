Package.describe({
    name: 'ohif:measurement-table',
    summary: 'OHIF Measurement table',
    version: '0.0.1'
});

Npm.depends({
    'dicomweb-client': '0.3.2',
    'xhr2': '0.1.4',
    'simpl-schema': '1.5.3'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');

    // Our custom packages
    api.use('ohif:cornerstone');
    api.use('ohif:core');
    api.use('ohif:viewerbase');
    api.use('ohif:measurements');

    api.mainModule('client/index.js', 'client');
});
