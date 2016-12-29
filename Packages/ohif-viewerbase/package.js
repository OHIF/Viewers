Package.describe({
    name: 'ohif:viewerbase',
    summary: 'Shared components and functions for Meteor DICOM Viewers',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('http');
    api.use('jquery');
    api.use('stylus');
    api.use('momentjs:moment');
    api.use('validatejs');

    // Our custom packages
    api.use('design');
    api.use('ohif:core');
    api.use('ohif:cornerstone');

    const assets = [
        'assets/icons.svg',
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


    // TODO: Use NPM depends for these
    api.addFiles('client/compatibility/jquery.hotkeys.js', 'client', {
        bare: true
    });
    api.addFiles('client/compatibility/dialogPolyfill.js', 'client', {
        bare: true
    });
    api.addFiles('client/compatibility/dialogPolyfill.styl', 'client');

    // ---------- Collections ----------
    api.addFiles('client/collections.js', 'client');

    // ---------- Components ----------

    // Basic components
    api.addFiles('client/components/basic/layout/layout.html', 'client');
    api.addFiles('client/components/basic/layout/layout.styl', 'client');
    api.addFiles('client/components/basic/loadingText/loadingText.html', 'client');
    api.addFiles('client/components/basic/loadingText/loadingText.styl', 'client');

    api.addFiles('client/components/basic/removableBackdrop/removableBackdrop.html', 'client');
    api.addFiles('client/components/basic/removableBackdrop/removableBackdrop.styl', 'client');

    api.addFiles('client/components/basic/aboutModal/aboutModal.html', 'client');
    api.addFiles('client/components/basic/aboutModal/aboutModal.js', 'client');
    api.addFiles('client/components/basic/aboutModal/aboutModal.styl', 'client');

    // Study Browser components
    api.addFiles('client/components/studyBrowser/studyBrowser/studyBrowser.html', 'client');
    api.addFiles('client/components/studyBrowser/studyBrowser/studyBrowser.js', 'client');
    api.addFiles('client/components/studyBrowser/studyBrowser/studyBrowser.styl', 'client');

    api.addFiles('client/components/studyBrowser/thumbnailEntry/thumbnailEntry.html', 'client');
    api.addFiles('client/components/studyBrowser/thumbnailEntry/thumbnailEntry.js', 'client');
    api.addFiles('client/components/studyBrowser/thumbnailEntry/thumbnailEntry.styl', 'client');

    api.addFiles('client/components/studyBrowser/imageThumbnail/imageThumbnail.html', 'client');
    api.addFiles('client/components/studyBrowser/imageThumbnail/imageThumbnail.js', 'client');
    api.addFiles('client/components/studyBrowser/imageThumbnail/imageThumbnail.styl', 'client');

    // Viewer components
    api.addFiles('client/components/viewer/imageViewerViewport/imageViewerViewport.html', 'client');
    api.addFiles('client/components/viewer/imageViewerViewport/imageViewerViewport.js', 'client');
    api.addFiles('client/components/viewer/imageViewerViewport/imageViewerViewport.styl', 'client');

    api.addFiles('client/components/viewer/gridLayout/gridLayout.html', 'client');
    api.addFiles('client/components/viewer/gridLayout/gridLayout.js', 'client');
    api.addFiles('client/components/viewer/gridLayout/gridLayout.styl', 'client');

    api.addFiles('client/components/viewer/loadingIndicator/loadingIndicator.html', 'client');
    api.addFiles('client/components/viewer/loadingIndicator/loadingIndicator.js', 'client');
    api.addFiles('client/components/viewer/loadingIndicator/loadingIndicator.styl', 'client');

    api.addFiles('client/components/viewer/annotationDialogs/annotationDialogs.html', 'client');
    api.addFiles('client/components/viewer/annotationDialogs/annotationDialogs.js', 'client');
    api.addFiles('client/components/viewer/annotationDialogs/annotationDialogs.styl', 'client');

    api.addFiles('client/components/viewer/viewportOrientationMarkers/viewportOrientationMarkers.html', 'client');
    api.addFiles('client/components/viewer/viewportOrientationMarkers/viewportOrientationMarkers.js', 'client');
    api.addFiles('client/components/viewer/viewportOrientationMarkers/viewportOrientationMarkers.styl', 'client');

    api.addFiles('client/components/viewer/viewportOverlay/viewportOverlay.html', 'client');
    api.addFiles('client/components/viewer/viewportOverlay/viewportOverlay.js', 'client');
    api.addFiles('client/components/viewer/viewportOverlay/viewportOverlay.styl', 'client');

    api.addFiles('client/components/viewer/viewerMain/viewerMain.html', 'client');
    api.addFiles('client/components/viewer/viewerMain/viewerMain.js', 'client');
    api.addFiles('client/components/viewer/viewerMain/viewerMain.styl', 'client');

    api.addFiles('client/components/viewer/imageControls/imageControls.html', 'client');
    api.addFiles('client/components/viewer/imageControls/imageControls.js', 'client');
    api.addFiles('client/components/viewer/imageControls/imageControls.styl', 'client');

    api.addFiles('client/components/viewer/layoutButton/layoutButton.html', 'client');
    api.addFiles('client/components/viewer/layoutButton/layoutButton.js', 'client');

    api.addFiles('client/components/viewer/layoutChooser/layoutChooser.html', 'client');
    api.addFiles('client/components/viewer/layoutChooser/layoutChooser.js', 'client');
    api.addFiles('client/components/viewer/layoutChooser/layoutChooser.styl', 'client');

    api.addFiles('client/components/viewer/cineDialog/cineDialog.html', 'client');
    api.addFiles('client/components/viewer/cineDialog/cineDialog.js', 'client');
    api.addFiles('client/components/viewer/cineDialog/cineDialog.styl', 'client');

    api.addFiles('client/components/viewer/toolbarSectionButton/toolbarSectionButton.html', 'client');
    api.addFiles('client/components/viewer/toolbarSectionButton/toolbarSectionButton.js', 'client');
    api.addFiles('client/components/viewer/toolbarSectionButton/toolbarSectionButton.styl', 'client');

    api.addFiles('client/components/viewer/toolbarSectionTools/toolbarSectionTools.html', 'client');
    api.addFiles('client/components/viewer/toolbarSectionTools/toolbarSectionTools.js', 'client');
    api.addFiles('client/components/viewer/toolbarSectionTools/toolbarSectionTools.styl', 'client');

    api.addFiles('client/components/viewer/playClipButton/playClipButton.html', 'client');
    api.addFiles('client/components/viewer/playClipButton/playClipButton.js', 'client');

    api.addFiles('client/components/viewer/confirmDeleteDialog/confirmDeleteDialog.html', 'client');
    api.addFiles('client/components/viewer/confirmDeleteDialog/confirmDeleteDialog.js', 'client');
    api.addFiles('client/components/viewer/confirmDeleteDialog/confirmDeleteDialog.styl', 'client');

    api.addFiles('client/components/viewer/displaySetNavigation/displaySetNavigation.html', 'client');
    api.addFiles('client/components/viewer/displaySetNavigation/displaySetNavigation.js', 'client');

    api.addFiles('client/components/viewer/studySeriesQuickSwitch/studySeriesQuickSwitch.html', 'client');
    api.addFiles('client/components/viewer/studySeriesQuickSwitch/studySeriesQuickSwitch.styl', 'client');
    api.addFiles('client/components/viewer/studySeriesQuickSwitch/studySeriesQuickSwitch.js', 'client');

    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepoint.html', 'client');
    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepoint.styl', 'client');
    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepoint.js', 'client');

    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepointBrowser.html', 'client');
    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepointBrowser.styl', 'client');
    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepointBrowser.js', 'client');

    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepointStudy.html', 'client');
    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepointStudy.styl', 'client');
    api.addFiles('client/components/viewer/studyTimepointBrowser/studyTimepointStudy.js', 'client');


    // Library functions
    api.addFiles('client/lib/layoutManager.js', 'client');
    api.addFiles('client/lib/createStacks.js', 'client');
    api.addFiles('client/lib/getImageId.js', 'client');
    api.addFiles('client/lib/getWADORSImageId.js', 'client');
    api.addFiles('client/lib/metaDataProvider.js', 'client');
    api.addFiles('client/lib/sortStudy.js', 'client');
    api.addFiles('client/lib/toolManager.js', 'client');
    api.addFiles('client/lib/enablePrefetchOnElement.js', 'client');
    api.addFiles('client/lib/displayReferenceLines.js', 'client');
    api.addFiles('client/lib/toggleDialog.js', 'client');
    api.addFiles('client/lib/setActiveViewport.js', 'client');
    api.addFiles('client/lib/switchToImageByIndex.js', 'client');
    api.addFiles('client/lib/switchToImageRelative.js', 'client');
    api.addFiles('client/lib/enableHotkeys.js', 'client');
    api.addFiles('client/lib/viewportFunctions.js', 'client');
    api.addFiles('client/lib/WLPresets.js', 'client');
    api.addFiles('client/lib/resizeViewportElements.js', 'client');
    api.addFiles('client/lib/setFocusToActiveViewport.js', 'client');
    api.addFiles('client/lib/updateAllViewports.js', 'client');
    api.addFiles('client/lib/stackImagePositionOffsetSynchronizer.js', 'client');

    api.addFiles('client/lib/instanceClassSpecificViewport.js', 'client');
    api.addFiles('client/lib/setMammogramViewportAlignment.js', 'client');
    api.addFiles('client/lib/isImage.js', 'client');
    api.addFiles('client/lib/sopClassDictionary.js', 'client');
    api.addFiles('client/lib/debugReactivity.js', 'client');
    api.addFiles('client/lib/unloadHandlers.js', 'client');

    api.export('resizeViewportElements', 'client');
    api.export('handleResize', 'client');
    api.export('enableHotkeys', 'client');
    api.export('enablePrefetchOnElement', 'client');
    api.export('displayReferenceLines', 'client');
    api.export('setActiveViewport', 'client');
    api.export('createStacks', 'client');
    api.export('getImageId', 'client');
    api.export('getWADORSImageId', 'client');
    api.export('metaDataProvider', 'client');
    api.export('sortStudy', 'client');
    api.export('updateOrientationMarkers', 'client');
    api.export('setFocusToActiveViewport', 'client');
    api.export('updateAllViewports', 'client');
    api.export('queryStudies', 'client');
    api.export('getNumberOfFilesInStudy', 'client');
    api.export('importStudies', 'client');
    api.export('getActiveViewportElement', 'client');
    api.export('getInstanceClassDefaultViewport', 'client');
    api.export('showConfirmDialog', 'client');
    api.export('applyWLPreset', 'client');
    api.export('toggleDialog', 'client');
    api.export('isImage', 'client');
    api.export('sopClassDictionary', 'client');
    api.export('addMetaData', 'client');
    api.export('hasMultipleFrames', 'client');
    api.export('isStackScrollLinkingDisabled')

    // Viewer management objects
    api.export('toolManager', 'client');
    api.export('LayoutManager', 'client');

    // Collections
    api.export('ViewerStudies', 'client');

    // UI Helpers
    api.addFiles([
        'client/lib/helpers/formatDA.js',
        'client/lib/helpers/formatJSDate.js',
        'client/lib/helpers/jsDateFromNow.js',
        'client/lib/helpers/formatNumberPrecision.js',
        'client/lib/helpers/formatTM.js',
        'client/lib/helpers/inc.js',
        'client/lib/helpers/isDisplaySetActive.js',
        'client/lib/helpers/getUsername.js',
        'client/lib/helpers/capitalizeFirstLetter.js',
        'client/lib/helpers/objectToPairs.js',
        'client/lib/helpers/objectEach.js',
        'client/lib/helpers/ifTypeIs.js',
        'client/lib/helpers/prettyPrintStringify.js',
        'client/lib/helpers/sorting.js',
        'client/lib/helpers/studyThumbnails.js',
        'client/lib/helpers/formatPN.js'
    ], 'client');
    api.export('formatPN', 'client');

    api.addFiles('client/lib/helpers/isTouchDevice.js', 'client');
    api.export('isTouchDevice', 'client');

    // TODO: Clean this up later, no real need to export these
    // Need to move functionList into viewerbase
    api.export('toggleCineDialog', 'client');
    api.export('toggleCinePlay', 'client');
    api.export('clearTools', 'client');
    api.export('resetViewport', 'client');
    api.export('invert', 'client');
    api.export('flipV', 'client');
    api.export('flipH', 'client');
    api.export('rotateR', 'client');
    api.export('rotateL', 'client');
    api.export('linkStackScroll', 'client');
});
