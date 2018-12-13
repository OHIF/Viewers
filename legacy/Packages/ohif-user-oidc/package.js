Package.describe({
    name: 'ohif:user-oidc',
    summary: 'OHIF Integration with OpenID Connect',
    version: '0.0.1'
});

Npm.depends({
    'oidc-client': '1.5.2'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript', 'client');

    // Our custom packages
    api.use('ohif:core', 'client');

    // Client imports
    api.mainModule('client/main.js', 'client');

    api.addAssets('public/js/oidc-client.min.js', 'client');
    api.addAssets('public/js/silentRefresh.js', 'client');
    api.addAssets('public/silent-refresh.html', 'client');
});
