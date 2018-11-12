Npm.depends({
    ajv: '4.10.4',
    url: '0.11.0',
    jspdf: '1.3.3'
});

Package.describe({
    name: 'ohif:measurements',
    summary: 'OHIF Measurement Tools',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('random');

    api.use('momentjs:moment');

    // Schema for Data Models
    api.use('aldeed:simple-schema');
    api.use('aldeed:collection2');

    // Template overriding
    api.use('aldeed:template-extension@4.0.0');

    // Our custom packages
    api.use('ohif:cornerstone');
    api.use('ohif:design');
    api.use('ohif:core');
    api.use('ohif:select-tree');
    api.use('ohif:log');
    api.use('ohif:studies');
    api.use('ohif:hanging-protocols');
    api.use('ohif:viewerbase');

    // Client and server imports
    api.addFiles('both/index.js', ['client', 'server']);

    // Client imports
    api.addFiles('client/index.js', 'client');

    api.export('MeasurementSchemaTypes', ['client', 'server']);
});
