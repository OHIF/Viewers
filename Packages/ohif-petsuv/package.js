Package.describe({
    name: 'ohif:petsuv',
    summary: 'OHIF PET SUV Measurement Tools',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('random');

    api.use('validatejs');

    // Template overriding
    api.use('aldeed:template-extension@4.0.0');

    // Our custom packages
    api.use('design');
    api.use('ohif:core');
    api.use('ohif:study-list');
    api.use('ohif:cornerstone');
    api.use('ohif:measurements');

    api.addFiles('both/configuration/ellipse.js', [ 'client', 'server' ]);
    api.addFiles('both/configuration/measurementTools.js', [ 'client', 'server' ]);

    api.addFiles('both/configuration/dataExchange.js', [ 'client', 'server' ]);
    api.addFiles('both/configuration/dataValidation.js', [ 'client', 'server' ]);
    api.addFiles('both/configuration/configuration.js', [ 'client', 'server' ]);

    api.addFiles('server/methods.js', 'server');
});
