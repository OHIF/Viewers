Package.describe({
    name: 'design',
    summary: 'OHIF Design styles and components',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.2.1');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');

    // Importable colors / typography settings
    api.addFiles([
        'app.styl',
        'styles/global.styl',
        'styles/mixins.styl',
        'styles/responsive.styl',
        'styles/spacings.styl',
        'styles/variables.styl',
        'styles/webfonts.styl'
    ], 'client', {
        isImport: true
    });

    // Rounded Button Group
    api.addFiles([
        'components/roundedButtonGroup/roundedButtonGroup.html',
        'components/roundedButtonGroup/roundedButtonGroup.styl',
        'components/roundedButtonGroup/roundedButtonGroup.js'
    ], 'client');

});
