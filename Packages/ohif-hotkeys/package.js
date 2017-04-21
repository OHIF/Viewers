Package.describe({
    name: 'ohif:hotkeys',
    summary: 'OHIF hotkeys management',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    // Meteor packages
    api.use('ecmascript');
    api.use('reactive-dict');

    // Main module definition
    api.mainModule('main.js', 'client');
});
