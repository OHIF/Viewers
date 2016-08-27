Package.describe({
    name: 'viewerbase',
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
    api.use('practicalmeteor:loglevel');
    api.use('momentjs:moment');
    api.use('validatejs');
    
    // Our custom packages
    api.use('design');
    api.use('ohif:core');
    api.use('cornerstone');

    api.addFiles('log.js');

    api.addAssets('assets/icons.svg', 'client');

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

    // Library functions
    api.addFiles('lib/layoutManager.js', 'client');
    api.addFiles('lib/createStacks.js', 'client');
    api.addFiles('lib/getImageId.js', 'client');
    api.addFiles('lib/getWADORSImageId.js', 'client');
    api.addFiles('lib/metaDataProvider.js', 'client');
    api.addFiles('lib/sortStudy.js', 'client');
    api.addFiles('lib/toolManager.js', 'client');
    api.addFiles('lib/enablePrefetchOnElement.js', 'client');
    api.addFiles('lib/displayReferenceLines.js', 'client');
    api.addFiles('lib/toggleDialog.js', 'client');
    api.addFiles('lib/setActiveViewport.js', 'client');
    api.addFiles('lib/switchToImageByIndex.js', 'client');
    api.addFiles('lib/switchToImageRelative.js', 'client');
    api.addFiles('lib/enableHotkeys.js', 'client');
    api.addFiles('lib/viewportFunctions.js', 'client');
    api.addFiles('lib/WLPresets.js', 'client');
    api.addFiles('lib/resizeViewportElements.js', 'client');
    api.addFiles('lib/setFocusToActiveViewport.js', 'client');
    api.addFiles('lib/updateAllViewports.js', 'client');
    
    api.addFiles('lib/instanceClassSpecificViewport.js', 'client');
    api.addFiles('lib/setMammogramViewportAlignment.js', 'client');
    api.addFiles('lib/isImage.js', 'client');
    api.addFiles('lib/sopClassDictionary.js', 'client');
    api.addFiles('lib/debugReactivity.js', 'client');

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
    api.export('exportStudies', 'client');
    api.export('importStudies', 'client');
    api.export('getActiveViewportElement', 'client');
    api.export('getInstanceClassDefaultViewport', 'client');
    api.export('showConfirmDialog', 'client');
    api.export('applyWLPreset', 'client');
    api.export('toggleDialog', 'client');
    api.export('isImage', 'client');
    api.export('sopClassDictionary', 'client');

    // Viewer management objects
    api.export('toolManager', 'client');
    api.export('LayoutManager', 'client');

    // Global objects
    api.export('ClientId', 'client');

    // Collections
    api.export('ViewerStudies', 'client');

    // UI Helpers
    api.addFiles([
        'lib/helpers/formatDA.js',
        'lib/helpers/formatJSDate.js',
        'lib/helpers/jsDateFromNow.js',
        'lib/helpers/formatNumberPrecision.js',
        'lib/helpers/formatTM.js',
        'lib/helpers/inlineIf.js',
        'lib/helpers/inc.js',
        'lib/helpers/isDisplaySetActive.js',
        'lib/helpers/getUsername.js',
        'lib/helpers/capitalizeFirstLetter.js',
        'lib/helpers/objectToPairs.js',
        'lib/helpers/objectEach.js',
        'lib/helpers/ifTypeIs.js',
        'lib/helpers/prettyPrintStringify.js',
        'lib/helpers/studyThumbnails.js',
        'lib/helpers/formatPN.js'
    ], 'client');
    api.export('formatPN', 'client');

    api.addFiles('lib/helpers/isTouchDevice.js', 'client');
    api.export('isTouchDevice', 'client');

    // TODO: Clean this up later, no real need to export these
    // Need to move functionList into viewerbase
    api.export('toggleCineDialog', 'client');
    api.export('toggleCinePlay', 'client');
    api.export('clearTools', 'client');
    api.export('resetViewport', 'client');
    api.export('invert', 'client');
});
