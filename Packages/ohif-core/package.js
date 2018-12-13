Npm.depends({
    'isomorphic-base64': '1.0.2',
    'jquery.hotkeys': '0.1.0',
    loglevel: '1.4.1',
    jquery: '3.3.1',
    underscore: "1.9.1",
    'dicomweb-client': '0.3.2',
    'xhr2': '0.1.4'
});

Package.describe({
    name: 'ohif:core',
    summary: 'OHIF core components, helpers and UI functions',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');
    api.use('stylus');
    api.use('templating');
    api.use('reactive-var');
    api.use('session');

    api.use('ohif:cornerstone');

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

    // Assets to be imported dynamically
    api.addAssets('public/js/svgxuse.min.js', 'client');


    // Client imports and routes
    api.addFiles('client/index.js', 'client');
});
