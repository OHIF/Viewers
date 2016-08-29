Package.describe({
    name: 'ohif:core',
    summary: 'OHIF core components, helpers and UI functions',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('underscore');
    api.use('templating');
    api.use('reactive-var');

    // Router dependencies
    api.use('clinical:router@2.0.18', 'client');

    // Component's library dependencies
    api.use('natestrauser:select2@4.0.1', 'client');

    // UI Styles
    api.addFiles([
        'client/ui/resizable/resizable.styl'
    ], 'client');

    api.mainModule('main.js', ['client', 'server']);

    // Client imports and routes
    api.addFiles('client/index.js', 'client');

    // Server imports and methods
    api.addFiles('server/index.js', 'server');

    // Client and server imports
    api.addFiles('both/index.js', ['client', 'server']);

});
