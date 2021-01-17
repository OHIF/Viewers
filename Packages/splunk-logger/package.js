Package.describe({
    name: 'gtajesgenga:splunk-logger',
    summary: 'Custom implementation of splunk HEC',
    version: '0.0.1'
});

Npm.depends({
    'splunk-logging-hec': '0.10.2',
    'os': '0.1.1'
});

Package.onUse(function(api) {
    api.versionsFrom('METEOR@1.6');
    api.use('ecmascript');
    api.use('ohif:log');
    api.addFiles('index.js', [ 'client', 'server' ]);
});
