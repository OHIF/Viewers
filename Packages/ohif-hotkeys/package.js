Package.describe({
    name: 'ohif:hotkeys',
    summary: 'OHIF hotkeys management',
    version: '0.0.1'
});

Npm.depends({
    'jquery.hotkeys': '0.1.0'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    // Meteor packages
    api.use([
        'ecmascript',
        'templating',
        'stylus',
        'reactive-var',
        'session',
        'clinical:router',
        'cultofcoders:persistent-session'
    ]);

    // OHIF dependencies
    api.use('ohif:commands');

    // Main module definition
    api.mainModule('main.js', 'client');

    // Client imports
    api.addFiles('client/index.js', 'client');
});
