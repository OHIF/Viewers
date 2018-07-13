Package.describe({
    name: 'ohif:user-keycloak',
    summary: 'OHIF Integration with Keycloak for Identity and Access Management',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.6');

    api.use('templating');
    api.use('ecmascript');
    api.use('service-configuration');
    api.use('accounts-base');

    // Our custom packages
    api.use('ohif:core');
    api.use('ohif:user');

    api.use('mxab:keycloak-oauth@0.0.2');
    api.use('mxab:keycloak-loader@0.0.2');
    api.use('mxab:accounts-keycloak');

    // Client imports
    api.mainModule('client/main.js', 'client');
    api.mainModule('server/main.js', 'server');
});
