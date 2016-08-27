Package.describe({
    name: 'validatejs',
    summary: 'OHIF Validatejs temporary',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.3.5.1');

    api.use('ecmascript');

    api.addFiles('lib/validate.js', 'client');
    api.addFiles('load.js', 'client');

    api.export('validate', 'client');
});