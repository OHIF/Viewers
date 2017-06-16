Package.describe({
    name: 'ohif:wadoproxy',
    summary: 'WADO-URI Proxy',
    version: '0.0.1'
});

Npm.depends({
    'performance-now': '2.1.0'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('iron:router@1.0.13');

    api.use('ohif:core');
    api.use('ohif:servers');

    api.addFiles('server/namespace.js', 'server');
    api.addFiles('server/initialize.js', 'server');
    api.addFiles('server/routes.js', 'server');
    api.addFiles('server/convertURL.js', 'server');

    // Global exports
    api.export('WADOProxy');
});
