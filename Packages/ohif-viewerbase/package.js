Package.describe({
    name: 'ohif:viewerbase',
    summary: 'Shared components and functions for Meteor DICOM Viewers',
    version: '0.0.1'
});

Npm.depends({
    'react-cornerstone-viewport': 'git://github.com:cornerstonejs/react-cornerstone-viewport.git',
    'react-viewerbase': 'git://github.com:OHIF/react-viewerbase.git',
    hammerjs: '2.0.8',
    'cornerstone-core': '2.2.8',
    'cornerstone-tools': '3.0.0-b.1471',
    'cornerstone-math': '0.1.7',
    'dicom-parser': '1.8.3',
    'cornerstone-wado-image-loader': '2.2.3',
    'react-redux': '6.0.0',
    jquery: '3.3.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.7');

    api.use(['ecmascript',
        'templating',
        'http',
        'stylus',
    ]);

    // OHIF dependencies
    api.use([
        'ohif:cornerstone',
        'ohif:core',
        'ohif:themes'
    ]);

    const assets = [
        'assets/icons.svg',
        'assets/user-menu-icons.svg',
        'assets/fonts/Roboto-Black-latin-ext.woff',
        'assets/fonts/Roboto-Black-latin-ext.woff2',
        'assets/fonts/Roboto-Black-latin.woff',
        'assets/fonts/Roboto-Black-latin.woff2',
        'assets/fonts/Roboto-BlackItalic-latin-ext.woff',
        'assets/fonts/Roboto-BlackItalic-latin-ext.woff2',
        'assets/fonts/Roboto-BlackItalic-latin.woff',
        'assets/fonts/Roboto-BlackItalic-latin.woff2',
        'assets/fonts/Roboto-Bold-latin-ext.woff',
        'assets/fonts/Roboto-Bold-latin-ext.woff2',
        'assets/fonts/Roboto-Bold-latin.woff',
        'assets/fonts/Roboto-Bold-latin.woff2',
        'assets/fonts/Roboto-BoldItalic-latin-ext.woff',
        'assets/fonts/Roboto-BoldItalic-latin-ext.woff2',
        'assets/fonts/Roboto-BoldItalic-latin.woff',
        'assets/fonts/Roboto-BoldItalic-latin.woff2',
        'assets/fonts/Roboto-Italic-latin-ext.woff',
        'assets/fonts/Roboto-Italic-latin-ext.woff2',
        'assets/fonts/Roboto-Italic-latin.woff',
        'assets/fonts/Roboto-Italic-latin.woff2',
        'assets/fonts/Roboto-Light-latin-ext.woff',
        'assets/fonts/Roboto-Light-latin-ext.woff2',
        'assets/fonts/Roboto-Light-latin.woff',
        'assets/fonts/Roboto-Light-latin.woff2',
        'assets/fonts/Roboto-LightItalic-latin-ext.woff',
        'assets/fonts/Roboto-LightItalic-latin-ext.woff2',
        'assets/fonts/Roboto-LightItalic-latin.woff',
        'assets/fonts/Roboto-LightItalic-latin.woff2',
        'assets/fonts/Roboto-Medium-latin-ext.woff',
        'assets/fonts/Roboto-Medium-latin-ext.woff2',
        'assets/fonts/Roboto-Medium-latin.woff',
        'assets/fonts/Roboto-Medium-latin.woff2',
        'assets/fonts/Roboto-MediumItalic-latin-ext.woff',
        'assets/fonts/Roboto-MediumItalic-latin-ext.woff2',
        'assets/fonts/Roboto-MediumItalic-latin.woff',
        'assets/fonts/Roboto-MediumItalic-latin.woff2',
        'assets/fonts/Roboto-Regular-latin-ext.woff',
        'assets/fonts/Roboto-Regular-latin-ext.woff2',
        'assets/fonts/Roboto-Regular-latin.woff',
        'assets/fonts/Roboto-Regular-latin.woff2',
        'assets/fonts/Roboto-Thin-latin-ext.woff',
        'assets/fonts/Roboto-Thin-latin-ext.woff2',
        'assets/fonts/Roboto-Thin-latin.woff',
        'assets/fonts/Roboto-Thin-latin.woff2',
        'assets/fonts/Roboto-ThinItalic-latin-ext.woff',
        'assets/fonts/Roboto-ThinItalic-latin-ext.woff2',
        'assets/fonts/Roboto-ThinItalic-latin.woff',
        'assets/fonts/Roboto-ThinItalic-latin.woff2',
        'assets/fonts/Sanchez-Regular-latin-ext.woff',
        'assets/fonts/Sanchez-Regular-latin-ext.woff2',
        'assets/fonts/Sanchez-Regular-latin.woff',
        'assets/fonts/Sanchez-Regular-latin.woff2'
    ];

    api.addAssets(assets, 'client');

    api.addFiles('client/compatibility/dialogPolyfill.js', 'client', {
        bare: true
    });
    api.addFiles('client/compatibility/dialogPolyfill.styl', 'client');

    // ---------- Components ----------

    // Basic components
    api.addFiles('client/components/basic/layout/layout.html', 'client');
    api.addFiles('client/components/basic/layout/layout.styl', 'client');
    api.addFiles('client/components/basic/loadingText/loadingText.html', 'client');
    api.addFiles('client/components/basic/loadingText/loadingText.styl', 'client');
    api.addFiles('client/components/basic/errorText/errorText.html', 'client');
    api.addFiles('client/components/basic/errorText/errorText.styl', 'client');

    api.addFiles('client/components/basic/removableBackdrop/removableBackdrop.html', 'client');
    api.addFiles('client/components/basic/removableBackdrop/removableBackdrop.styl', 'client');

    api.addFiles('client/components/basic/aboutModal/aboutModal.html', 'client');
    api.addFiles('client/components/basic/aboutModal/aboutModal.js', 'client');
    api.addFiles('client/components/basic/aboutModal/aboutModal.styl', 'client');

    // Viewer components
    api.addFiles('client/components/viewer/annotationDialogs/annotationDialogs.html', 'client');
    api.addFiles('client/components/viewer/annotationDialogs/annotationDialogs.js', 'client');
    api.addFiles('client/components/viewer/annotationDialogs/annotationDialogs.styl', 'client');

    api.addFiles('client/components/viewer/layoutButton/layoutButton.html', 'client');
    api.addFiles('client/components/viewer/layoutButton/layoutButton.js', 'client');

    api.addFiles('client/components/viewer/layoutChooser/layoutChooser.html', 'client');
    api.addFiles('client/components/viewer/layoutChooser/layoutChooser.js', 'client');
    api.addFiles('client/components/viewer/layoutChooser/layoutChooser.styl', 'client');

    api.addFiles('client/components/viewer/cineDialog/cineDialog.html', 'client');
    api.addFiles('client/components/viewer/cineDialog/cineDialog.js', 'client');
    api.addFiles('client/components/viewer/cineDialog/cineDialog.styl', 'client');

    api.addFiles('client/components/viewer/downloadDialog/downloadDialog.html', 'client');
    api.addFiles('client/components/viewer/downloadDialog/downloadDialog.js', 'client');
    api.addFiles('client/components/viewer/downloadDialog/downloadDialog.styl', 'client');

    api.addFiles('client/components/viewer/toolbarSectionButton/toolbarSectionButton.html', 'client');
    api.addFiles('client/components/viewer/toolbarSectionButton/toolbarSectionButton.js', 'client');
    api.addFiles('client/components/viewer/toolbarSectionButton/toolbarSectionButton.styl', 'client');

    api.addFiles('client/components/viewer/toolbarSectionTools/toolbarSectionTools.html', 'client');
    api.addFiles('client/components/viewer/toolbarSectionTools/toolbarSectionTools.js', 'client');
    api.addFiles('client/components/viewer/toolbarSectionTools/toolbarSectionTools.styl', 'client');

    api.addFiles('client/components/viewer/userPreferences/dialog.html', 'client');
    api.addFiles('client/components/viewer/userPreferences/dialog.js', 'client');
    api.addFiles('client/components/viewer/userPreferences/dialog.styl', 'client');

    api.addFiles('client/components/viewer/confirmDeleteDialog/confirmDeleteDialog.html', 'client');
    api.addFiles('client/components/viewer/confirmDeleteDialog/confirmDeleteDialog.js', 'client');
    api.addFiles('client/components/viewer/confirmDeleteDialog/confirmDeleteDialog.styl', 'client');

    api.addFiles('client/components/viewer/seriesQuickSwitch/seriesQuickSwitch.html', 'client');
    api.addFiles('client/components/viewer/seriesQuickSwitch/seriesQuickSwitch.styl', 'client');
    api.addFiles('client/components/viewer/seriesQuickSwitch/seriesQuickSwitch.js', 'client');

    api.addFiles('client/components/viewer/studySeriesQuickSwitch/studySeriesQuickSwitch.html', 'client');
    api.addFiles('client/components/viewer/studySeriesQuickSwitch/studySeriesQuickSwitch.styl', 'client');
    api.addFiles('client/components/viewer/studySeriesQuickSwitch/studySeriesQuickSwitch.js', 'client');

    /*api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepoint.html', 'client');
    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepoint.styl', 'client');
    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepoint.js', 'client');

    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepointBrowser.html', 'client');
    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepointBrowser.styl', 'client');
    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepointBrowser.js', 'client');

    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepointStudy.html', 'client');
    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepointStudy.js', 'client');*/

    api.addFiles('client/components/viewer/windowLevelPresets/form.html', 'client');
    api.addFiles('client/components/viewer/windowLevelPresets/form.js', 'client');

    api.export('dialogPolyfill', 'client');

    api.addAssets('assets/theme-icons.png', 'client');

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

    api.mainModule('main.js', 'client');

});
