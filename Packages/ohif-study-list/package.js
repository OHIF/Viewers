Npm.depends({
    daterangepicker: '3.0.3',
    hammerjs: '2.0.8'
});

Package.describe({
    name: 'ohif:study-list',
    summary: 'Basic study list for web-based DICOM viewers',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery', 'client');
    api.use('stylus', 'client');
    api.use('http', 'client');
    api.use('random', 'client');
    api.use('silentcicero:jszip', 'client');
    api.use('aldeed:simple-schema');
    api.use('aldeed:collection2');

    // Note: MomentJS appears to be required for Bootstrap3 Datepicker, but not a dependency for some reason
    api.use('momentjs:moment', 'client');

    // Our custom packages
    api.use('ohif:design');
    api.use('ohif:core');
    api.use('ohif:log');
    api.use('ohif:servers');
    api.use('ohif:viewerbase');
    api.use('ohif:wadoproxy');
    api.use('ohif:studies');

    // Client and server imports
    api.addFiles('both/index.js', [ 'client', 'server' ]);

    // Server imports
    api.addFiles('server/index.js', 'server');

    // Client imports
    api.addFiles('client/index.js', 'client');
});
