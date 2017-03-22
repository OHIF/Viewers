Package.describe({
    name: 'ohif:user',
    summary: 'OHIF User Authentication Handling',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    // Meteor client and server packages
    api.use('ecmascript');

    // Meteor client-only packages
    api.use([
        'templating',
        'stylus',
        'iron:router'
    ], 'client');

    // OHIF dependencies
    api.use('ohif:design');
    api.use('ohif:core');

    api.addFiles('client/index.js', 'client');
});
