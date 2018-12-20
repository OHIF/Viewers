Package.describe({
    name: 'ohif:metadata',
    summary: 'OHIF Metadata classes',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');

    api.use('ohif:core');
    api.use('ohif:viewerbase');

    api.mainModule('main.js', 'client');
});
