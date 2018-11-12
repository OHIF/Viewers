Package.describe({
    name: 'ohif:wadoproxy',
    summary: 'WADO-URI Proxy',
    version: '0.0.1'
});

Npm.depends({
    'query-string': '5.1.1',
    'performance-now': '2.1.0'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');
    api.use('clinical:router@2.0.19');

    api.use('ohif:core');
    api.use('ohif:servers');

    api.addFiles('both/namespace.js', ['client', 'server']);
    api.addFiles('both/convertURL.js', ['client', 'server']);
    api.addFiles('both/initialize.js', ['client', 'server']);
    api.addFiles('server/routes.js', 'server');

    // Global exports
    api.export('WADOProxy');
});
