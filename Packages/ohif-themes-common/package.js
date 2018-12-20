Package.describe({
    name: 'ohif:themes-common',
    summary: 'OHIF Common Themes',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use('ecmascript');
    api.use('templating');
    api.use('stylus');

    // Client imports
    api.addFiles('client/index.js', 'client');

    // Importable themes
    api.addFiles([
        'themes.styl',
        'themes/theme-tide.styl',
        'themes/theme-tigerlily.styl',
        'themes/theme-crickets.styl',
        'themes/theme-honeycomb.styl',
        'themes/theme-mint.styl',
        'themes/theme-overcast.styl',
        'themes/theme-quartz.styl'
    ], 'client', {
        isImport: true
    });
});
