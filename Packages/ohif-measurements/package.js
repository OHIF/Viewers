Npm.depends({
    ajv: '4.10.4',
    url: '0.11.0',
    jspdf: '1.3.3',
    moment: '2.22.2',
    jquery: '3.3.1'
});

Package.describe({
    name: 'ohif:measurements',
    summary: 'OHIF Measurement Tools',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');
    api.use('stylus');
    api.use('random');

    // Schema for Data Models
    api.use('aldeed:simple-schema');
    api.use('aldeed:collection2');

    // Template overriding
    api.use('aldeed:template-extension@4.0.0');

    // Our custom packages
    api.use('ohif:cornerstone');
    api.use('ohif:core');
    api.use('ohif:studies');
    api.use('ohif:viewerbase');

    // Client imports
    api.addFiles('src/index.js', 'client');

    api.export('MeasurementSchemaTypes', 'client');
});
