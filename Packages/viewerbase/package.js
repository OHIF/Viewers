Package.describe({
    name: 'viewerbase',
    summary: 'Shared components and functions for Meteor DICOM Viewers',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom(['1.2.1', '1.3.2.4']);

    api.use('standard-app-packages');
    api.use('ecmascript');
    api.use('http');
    api.use('jquery');
    api.use('stylus');
    api.use('practicalmeteor:loglevel');
    api.use('momentjs:moment');    
    api.use('validatejs');
    api.use('design');

    // Our custom packages
    api.use('cornerstone');

    api.addFiles('log.js');

    // TODO: Use NPM depends for these
    api.addFiles('client/compatibility/jquery.hotkeys.js', 'client');

    // Data validation (the Meteor package is currently out-of-date)
    //api.addFiles('client/compatibility/validate.js', 'client');

    // ---------- Collections ----------
    api.addFiles('client/collections.js', 'client');

    // ---------- Components ----------

    // Basic components
    api.addFiles('client/components/basic/loadingText/loadingText.html', 'client');
    api.addFiles('client/components/basic/loadingText/loadingText.styl', 'client');

    api.addFiles('client/components/basic/removableBackdrop/removableBackdrop.html', 'client');
    api.addFiles('client/components/basic/removableBackdrop/removableBackdrop.styl', 'client');

    api.addFiles('client/components/basic/confirmDeleteDialog/confirmDeleteDialog.html', 'client');
    api.addFiles('client/components/basic/confirmDeleteDialog/confirmDeleteDialog.styl', 'client');
    api.addFiles('client/components/basic/confirmDeleteDialog/confirmDeleteDialog.js', 'client');

    // Study Browser components
    api.addFiles('client/components/studyBrowser/studyBrowser/studyBrowser.html', 'client');
    api.addFiles('client/components/studyBrowser/studyBrowser/studyBrowser.js', 'client');
    api.addFiles('client/components/studyBrowser/studyBrowser/studyBrowser.styl', 'client');

    api.addFiles('client/components/studyBrowser/relatedStudySelect/relatedStudySelect.html', 'client');
    api.addFiles('client/components/studyBrowser/relatedStudySelect/relatedStudySelect.js', 'client');
    api.addFiles('client/components/studyBrowser/relatedStudySelect/relatedStudySelect.styl', 'client');

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

    api.addFiles('client/components/viewer/viewportOrientationMarkers/viewportOrientationMarkers.html', 'client');
    api.addFiles('client/components/viewer/viewportOrientationMarkers/viewportOrientationMarkers.js', 'client');
    api.addFiles('client/components/viewer/viewportOrientationMarkers/viewportOrientationMarkers.styl', 'client');

    api.addFiles('client/components/viewer/viewportOverlay/viewportOverlay.html', 'client');
    api.addFiles('client/components/viewer/viewportOverlay/viewportOverlay.js', 'client');
    api.addFiles('client/components/viewer/viewportOverlay/viewportOverlay.styl', 'client');

    api.addFiles('client/components/viewer/imageControls/imageControls.html', 'client');
    api.addFiles('client/components/viewer/imageControls/imageControls.js', 'client');
    api.addFiles('client/components/viewer/imageControls/imageControls.styl', 'client');

    api.addFiles('client/components/viewer/layoutChooser/layoutChooser.html', 'client');
    api.addFiles('client/components/viewer/layoutChooser/layoutChooser.js', 'client');
    api.addFiles('client/components/viewer/layoutChooser/layoutChooser.styl', 'client');

    api.addFiles('client/components/viewer/cineDialog/cineDialog.html', 'client');
    api.addFiles('client/components/viewer/cineDialog/cineDialog.js', 'client');
    api.addFiles('client/components/viewer/cineDialog/cineDialog.styl', 'client');

    api.addFiles('client/components/viewer/simpleToolbarButton/simpleToolbarButton.html', 'client');

    api.addFiles('client/components/viewer/playClipButton/playClipButton.html', 'client');
    api.addFiles('client/components/viewer/playClipButton/playClipButton.js', 'client');

    api.addFiles('client/components/viewer/toolbar/toolbar.html', 'client');
    api.addFiles('client/components/viewer/toolbar/toolbar.js', 'client');
    api.addFiles('client/components/viewer/toolbar/toolbar.styl', 'client');

    api.addFiles('client/components/viewer/toolbarGroupButton/toolbarGroupButton.html', 'client');
    api.addFiles('client/components/viewer/toolbarGroupButton/toolbarGroupButton.styl', 'client');
    api.addFiles('client/components/viewer/toolbarGroupButton/toolbarGroupButton.js', 'client');

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
    api.addFiles('lib/draggable.js', 'client');
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
    api.addFiles('lib/queryStudies.js', 'client');
    api.addFiles('lib/importStudies.js', 'client');
    //api.addFiles('lib/validators.js', 'client');
    api.addFiles('lib/instanceClassSpecificViewport.js', 'client');
    api.addFiles('lib/setMammogramViewportAlignment.js', 'client');

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

    // Export the ValidateJS Library with our added validators
    //api.export('validate', 'client');

    // Viewer management objects
    api.export('toolManager', 'client');
    api.export('LayoutManager', 'client');

    // Global objects
    api.export('OHIF', 'client');
    api.export('ClientId', 'client');

    // Collections
    api.export('ViewerStudies', 'client');

    // UI Helpers
    api.addFiles('lib/helpers/formatDA.js', 'client');
    api.addFiles('lib/helpers/logical.js', 'client');
    api.addFiles('lib/helpers/formatJSDate.js', 'client');
    api.addFiles('lib/helpers/jsDateFromNow.js', 'client');
    api.addFiles('lib/helpers/formatNumberPrecision.js', 'client');
    api.addFiles('lib/helpers/formatTM.js', 'client');
    api.addFiles('lib/helpers/inlineIf.js', 'client');
    api.addFiles('lib/helpers/inc.js', 'client');
    api.addFiles('lib/helpers/getUsername.js', 'client');
    api.addFiles('lib/helpers/capitalizeFirstLetter.js', 'client');
    api.addFiles('lib/helpers/objectToPairs.js', 'client');
    api.addFiles('lib/helpers/objectEach.js', 'client');
    api.addFiles('lib/helpers/ifTypeIs.js', 'client');
    api.addFiles('lib/helpers/prettyPrintStringify.js', 'client');
    api.addFiles('lib/helpers/formatPN.js', 'client');
    api.export('formatPN', 'client');

    api.addFiles('lib/helpers/isTouchDevice.js', 'client');
    api.export('isTouchDevice', 'client');

    api.addFiles('server/methods/importStudies.js', 'server');

    api.export('importStudies', 'server');
    api.export('importSupported', 'server');

    // Collections
    api.addFiles('both/collections.js', [ 'client', 'server' ]);
    api.addFiles('server/collections.js', 'server');
    api.export('StudyImportStatus', [ 'client', 'server' ]);
});
