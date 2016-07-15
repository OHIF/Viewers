Package.describe({
    name: 'ohif:core',
    summary: 'OHIF core components, helpers and UI functions',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.3.4.1');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('underscore');
    api.use('templating');
    api.use('reactive-var');

    api.use('natestrauser:select2@4.0.1', 'client');

    api.mainModule('main.js', 'client');
});
