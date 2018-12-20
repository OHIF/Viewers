Package.describe({
    name: 'ohif:cornerstone-settings',
    summary: 'Cornerstone Settings package',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');
    api.use('ohif:cornerstone');
    api.use('ohif:core');

    api.mainModule('client/main.js', 'client');
});
