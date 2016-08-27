Package.describe({
    name: 'wadoproxy',
    summary: 'WADO-URI Proxy',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('clinical:router');


    api.addFiles('server/namespace.js');
    
    // Server-only
    api.addFiles('server/initialize.js', 'server');
    api.addFiles('server/routes.js', 'server');

    // Global exports
    api.export('WADOProxy');
});
