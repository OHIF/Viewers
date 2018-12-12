Npm.depends({
    daterangepicker: '3.0.3',
    hammerjs: '2.0.8',
    moment: '2.22.2',
    jquery: '3.3.1'
});

Package.describe({
    name: 'ohif:study-list',
    summary: 'Basic study list for web-based DICOM viewers',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript', 'client');
    api.use('templating', 'client');
    api.use('stylus', 'client');
    api.use('http', 'client');
    api.use('random', 'client');
    api.use('aldeed:simple-schema', 'client');
    api.use('aldeed:collection2', 'client');
    api.use('gadicc:blaze-react-component', 'client');

    // Our custom packages
    api.use('ohif:core', 'client');
    api.use('ohif:viewerbase', 'client');
    api.use('ohif:studies', 'client');

    // Client imports
    api.addFiles('client/index.js', 'client');
});
