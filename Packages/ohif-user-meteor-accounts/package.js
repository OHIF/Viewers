Package.describe({
    name: 'ohif:user-meteor-accounts',
    summary: 'OHIF Integration with Meteor Accounts',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');
    api.use('templating');
    api.use('stylus');

    api.use('accounts-base');
    api.use('accounts-password');

    // Our custom packages
    api.use('ohif:core');

    // Client imports
    api.mainModule('client/main.js', 'client');

    // Server imports
    api.mainModule('server/main.js', 'server');
});
