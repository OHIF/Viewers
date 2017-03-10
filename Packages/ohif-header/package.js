Package.describe({
    name: 'ohif:header',
    summary: 'OHIF Header Templates',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4.2.3');

    // Meteor packages
    api.use('ecmascript');
    api.use('stylus');

    // OHIF dependencies
    api.use('ohif:core', 'client');

    // Client imports
    api.addFiles('index.js', 'client');
});
