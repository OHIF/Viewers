Package.describe({
    name: 'ohif:design',
    summary: 'OHIF Design styles and components',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.3.5.1');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');

    api.addAssets('assets/theme-icons.png', 'client');

    // Importable colors / typography settings
    api.addFiles([
        'app.styl',
        'styles/imports/mixins.styl',
        'styles/imports/spacings.styl',
        'styles/imports/variables.styl',
        'styles/imports/theming.styl',
        'styles/imports/theme-icons.styl',
        'styles/imports/themes/theme-tide.styl',
        'styles/imports/themes/theme-tigerlily.styl',
        'styles/imports/themes/theme-crickets.styl',
        'styles/imports/themes/theme-honeycomb.styl',
        'styles/imports/themes/theme-mint.styl',
        'styles/imports/themes/theme-overcast.styl',
        'styles/imports/themes/theme-quartz.styl'
    ], 'client', {
        isImport: true
    });

    // Common styles
    api.addFiles([
        'styles/common/webfonts.styl',
        'styles/common/keyframes.styl',
        'styles/common/global.styl',
        'styles/common/spacings.styl'
    ], 'client');

    // Component styles
    api.addFiles([
        'styles/components/dialog.styl',
        'styles/components/radio.styl',
        'styles/components/select2.styl',
        'styles/components/states.styl'
    ], 'client');

    // Rounded Button Group
    api.addFiles([
        'components/roundedButtonGroup/roundedButtonGroup.html',
        'components/roundedButtonGroup/roundedButtonGroup.styl',
        'components/roundedButtonGroup/roundedButtonGroup.js'
    ], 'client');
});
