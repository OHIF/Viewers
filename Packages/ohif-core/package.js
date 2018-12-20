Npm.depends({
    'isomorphic-base64': '1.0.2',
});

Package.describe({
    name: 'ohif:core',
    summary: 'OHIF core components, helpers and UI functions',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('underscore');
    api.use('templating');
    api.use('reactive-var');

    // Router dependencies
    api.use('clinical:router@2.0.19', 'client');

    // Component's library dependencies
    api.use('natestrauser:select2@4.0.1', 'client');
    api.use('aldeed:simple-schema');

    // UI Styles
    api.addFiles([
        'client/ui/dimensional/dimensional.styl',
        'client/ui/resizable/resizable.styl',
        'client/components/bootstrap/dialog/bootstrap.styl',
        'client/components/bootstrap/dialog/loading.styl',
        'client/components/bootstrap/dialog/progress.styl',
        'client/components/bootstrap/dialog/unsavedChangesDialog.styl',
        'client/components/bootstrap/dropdown/dropdown.styl'
    ], 'client');

    api.mainModule('main.js', ['client', 'server']);

    // Client imports and routes
    api.addFiles('client/index.js', 'client');

    // Client and server imports
    api.addFiles('both/index.js', ['client', 'server']);
});
