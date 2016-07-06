Package.describe({
    name: 'design',
    summary: 'OHIF Design styles and components',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.3.4.1');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');

    // Importable colors / typography settings
    api.addFiles([
        'app.styl',
        'styles/imports/mixins.styl',
        'styles/imports/spacings.styl',
        'styles/imports/variables.styl'
    ], 'client', {
        isImport: true
    });

    // Common styles
    api.addFiles([
        'styles/common/webfonts.styl',
        'styles/common/global.styl',
        'styles/common/spacings.styl'
    ], 'client');

    // Rounded Button Group
    api.addFiles([
        'components/roundedButtonGroup/roundedButtonGroup.html',
        'components/roundedButtonGroup/roundedButtonGroup.styl',
        'components/roundedButtonGroup/roundedButtonGroup.js'
    ], 'client');

    // Radio Option
    api.addFiles([
        'components/radioOption/radioOption.html',
        'components/radioOption/radioOption.styl'
    ], 'client');

});
