Package.describe({
    name: 'ohif:header',
    summary: 'OHIF Header Templates',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    // Meteor packages
    api.use('ecmascript');
    api.use('templating');
    api.use('underscore');
    api.use('stylus');

    // OHIF dependencies
    api.use('ohif:core', 'client');

    // Main module
    api.mainModule('main.js', 'client');

    // Client imports
    api.addFiles('client/index.js', 'client');
});
