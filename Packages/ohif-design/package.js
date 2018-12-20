/*
 * Manually including bootstrap to avoid XSS attacks on data-target attributes
 * Issue reference: https://github.com/twbs/bootstrap/issues/20184
 *
 * As Bootstrap 3 is no longer being officially developed or supported, they created a branch on
 * the official repository that contains the fix for the XSS attacks
 * Branch: https://github.com/twbs/bootstrap/tree/v3.4.0-dev
 *
 * We stopped using the Meteor's twbs:bootstrap package and started adding the files manually
 */

Package.describe({
    name: 'ohif:design',
    summary: 'OHIF Design styles and components',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');

    api.use('ohif:themes');

    // Bootstrap fonts
    api.addAssets([
        'bootstrap/fonts/glyphicons-halflings-regular.eot',
        'bootstrap/fonts/glyphicons-halflings-regular.svg',
        'bootstrap/fonts/glyphicons-halflings-regular.ttf',
        'bootstrap/fonts/glyphicons-halflings-regular.woff',
        'bootstrap/fonts/glyphicons-halflings-regular.woff2'
    ], 'client');

    api.addAssets('assets/theme-icons.png', 'client');

    // Bootstrap files
    api.addFiles([
        'bootstrap/css/bootstrap.css',
        'bootstrap/js/bootstrap.js'
    ], 'client');

    // Importable colors / typography settings
    api.addFiles([
        'app.styl',
        'styles/imports/mixins.styl',
        'styles/imports/spacings.styl',
        'styles/imports/variables.styl',
        'styles/imports/theming.styl',
        'styles/imports/theme-icons.styl'
    ], 'client', {
        isImport: true
    });

    // Common styles
    api.addFiles([
        'styles/common/webfonts.styl',
        'styles/common/keyframes.styl',
        'styles/common/global.styl',
        'styles/common/form.styl',
        'styles/common/spacings.styl'
    ], 'client');

    // Component styles
    api.addFiles([
        'styles/components/dialog.styl',
        'styles/components/popover.styl',
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
