Package.describe({
    name: 'ohif:select-tree',
    summary: 'OHIF Select Tree component',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    // Meteor packages
    api.use([
        'ecmascript',
        'templating',
        'stylus',
        'tracker',
        'reactive-var',
        'underscore',
        'jquery'
    ]);

    // OHIF dependencies
    api.use('ohif:core');

    // Client imports
    api.addFiles('client/index.js', 'client');
});
