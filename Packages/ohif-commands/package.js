Package.describe({
    name: 'ohif:commands',
    summary: 'OHIF commands management',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    // Meteor packages
    api.use([
        'ecmascript',
        'reactive-var'
    ]);

    // OHIF dependencies
    api.use('ohif:core');
    api.use('ohif:log');

    // Main module definition
    api.mainModule('main.js', 'client');
});
