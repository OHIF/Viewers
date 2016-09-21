Package.describe({
    name: 'ohif:pim-timc-api',
    summary: 'OHIF PIM TIMC Server API',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');
    api.use('ecmascript');
    api.use('http');
    api.mainModule('main.js', ['server', 'client']);
});
