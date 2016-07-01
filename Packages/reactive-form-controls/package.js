Package.describe({
    name: 'reactive-form-controls',
    summary: 'A set of basic form controls that store their state in a ReactiveDict',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.3.4.1');

    api.use('standard-app-packages');
    api.use('ecmascript');
    api.use('jquery');
    api.use('stylus');
    api.use('reactive-dict');
    api.use('templating');
    api.use('natestrauser:select2@4.0.1', 'client');

    api.addFiles('client/helpers/getSchema.js', ['client']);
    api.addFiles('client/helpers/isInvalidKey.js', ['client']);
    api.addFiles('client/helpers/stateDataWithKey.js', ['client']);
    api.addFiles('client/helpers/equals.js', ['client']);

    api.addFiles('client/components/helpBlock/helpBlock.html', ['client']);
    api.addFiles('client/components/helpBlock/helpBlock.js', ['client']);

    api.addFiles('client/components/radioOptionGroup/radioOptionGroup.html', ['client']);
    api.addFiles('client/components/radioOptionGroup/radioOptionGroup.js', ['client']);

    api.addFiles('client/components/selectInput/selectInput.html', ['client']);
    api.addFiles('client/components/selectInput/selectInput.js', ['client']);

    api.addFiles('client/components/select2Input/select2Input.html', ['client']);
    api.addFiles('client/components/select2Input/select2Input.js', ['client']);

});