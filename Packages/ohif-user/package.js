Package.describe({
    name: 'ohif:user',
    summary: 'OHIF User Authentication Handling',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    // Meteor client and server packages
    api.use([
        'ecmascript',
        'accounts-base',
        'accounts-password'
    ]);

    // Meteor client-only packages
    api.use([
        'templating',
        'stylus',
        'iron:router'
    ], 'client');

    // OHIF dependencies
    api.use('ohif:design');
    api.use('ohif:core');

    // Main module
    api.mainModule('main.js', ['client', 'server']);

    // Server imports
    api.addFiles('server/index.js', 'server');

    // Client imports
    api.addFiles('client/index.js', 'client');
});
