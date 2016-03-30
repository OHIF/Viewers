Package.describe({
    name: 'viewerbase',
    summary: 'Shared components and functions for Meteor DICOM Viewers',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.2.0.2');

    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('accounts-password');
    api.use('ian:accounts-ui-bootstrap-3');
    api.use('http');
    api.use('practicalmeteor:loglevel');
    api.use('momentjs:moment');

    // Our custom packages
    api.use('dicomweb');
    api.use('dimseservice');
    api.use('cornerstone');
    api.use('hangingprotocols');

    api.addFiles('log.js', ['client', 'server']);

    // TODO= Find a meteor package for this
    api.addFiles('client/compatibility/jquery.hotkeys.js', 'client');

    // ---------- Collections ----------
    api.addFiles('client/collections.js', 'client');

    // ---------- Components ----------

    // Basic components
    api.addFiles('client/components/basic/layout/layout.html', 'client');
    api.addFiles('client/components/basic/layout/layout.styl', 'client');
    api.addFiles('client/components/basic/login/login.html', 'client');
    api.addFiles('client/components/basic/notFound/notFound.html', 'client');

    api.addFiles('client/components/basic/loadingText/loadingText.html', 'client');
    api.addFiles('client/components/basic/loadingText/loadingText.styl', 'client');

    api.addFiles('client/components/basic/studyNotFound/studyNotFound.html', 'client');
    api.addFiles('client/components/basic/studyNotFound/studyNotFound.styl', 'client');

    api.addFiles('client/components/basic/removableBackdrop/removableBackdrop.html', 'client');
    api.addFiles('client/components/basic/removableBackdrop/removableBackdrop.styl', 'client');

    api.addFiles('client/components/basic/hidingPanel/hidingPanel.html', 'client');
    api.addFiles('client/components/basic/hidingPanel/hidingPanel.js', 'client');
    api.addFiles('client/components/basic/hidingPanel/hidingPanel.styl', 'client');

    // Study Browser components
    api.addFiles('client/components/studyBrowser/studyBrowser/studyBrowser.html', 'client');
    api.addFiles('client/components/studyBrowser/studyBrowser/studyBrowser.js', 'client');
    api.addFiles('client/components/studyBrowser/studyBrowser/studyBrowser.styl', 'client');

    api.addFiles('client/components/studyBrowser/thumbnailEntry/thumbnailEntry.html', 'client');
    api.addFiles('client/components/studyBrowser/thumbnailEntry/thumbnailEntry.js', 'client');
    api.addFiles('client/components/studyBrowser/thumbnailEntry/thumbnailEntry.styl', 'client');

    api.addFiles('client/components/studyBrowser/thumbnails/thumbnails.html', 'client');
    api.addFiles('client/components/studyBrowser/thumbnails/thumbnails.js', 'client');

    api.addFiles('client/components/studyBrowser/imageThumbnail/imageThumbnail.html', 'client');
    api.addFiles('client/components/studyBrowser/imageThumbnail/imageThumbnail.js', 'client');
    api.addFiles('client/components/studyBrowser/imageThumbnail/imageThumbnail.styl', 'client');

    // Viewer components
    api.addFiles('client/components/viewer/imageViewerViewport/imageViewerViewport.html', 'client');
    api.addFiles('client/components/viewer/imageViewerViewport/imageViewerViewport.js', 'client');
    api.addFiles('client/components/viewer/imageViewerViewport/imageViewerViewport.styl', 'client');

    api.addFiles('client/components/viewer/imageViewerViewports/imageViewerViewports.html', 'client');
    api.addFiles('client/components/viewer/imageViewerViewports/imageViewerViewports.js', 'client');
    api.addFiles('client/components/viewer/imageViewerViewports/imageViewerViewports.styl', 'client');

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

    api.addFiles('client/components/viewer/hangingProtocolButtons/hangingProtocolButtons.html', 'client');
    api.addFiles('client/components/viewer/hangingProtocolButtons/hangingProtocolButtons.js', 'client');

    api.addFiles('client/components/viewer/layoutButton/layoutButton.html', 'client');

    api.addFiles('client/components/viewer/toolbar/toolbar.html', 'client');
    api.addFiles('client/components/viewer/toolbar/toolbar.js', 'client');
    api.addFiles('client/components/viewer/toolbar/toolbar.styl', 'client');

    api.addFiles('client/components/basic/progressDialog/progressDialog.html', 'client');
    api.addFiles('client/components/basic/progressDialog/progressDialog.styl', 'client');
    api.addFiles('client/components/basic/progressDialog/progressDialog.js', 'client');

    api.addFiles('client/components/viewer/toolbarGroupButton/toolbarGroupButton.html', 'client');
    api.addFiles('client/components/viewer/toolbarGroupButton/toolbarGroupButton.styl', 'client');
    api.addFiles('client/components/viewer/toolbarGroupButton/toolbarGroupButton.js', 'client');


    // Library functions
    api.addFiles('lib/accountsConfig.js', 'client');
    api.addFiles('lib/createStacks.js', 'client');
    api.addFiles('lib/getImageId.js', 'client');
    api.addFiles('lib/getWADORSImageId.js', 'client');
    api.addFiles('lib/metaDataProvider.js', 'client');
    api.addFiles('lib/rerenderViewportWithNewSeries.js', 'client');
    api.addFiles('lib/sortStudy.js', 'client');
    api.addFiles('lib/toolManager.js', 'client');
    api.addFiles('lib/windowManager.js', 'client');
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
    api.addFiles('lib/exportStudies.js', 'client');
    api.addFiles('lib/importStudies.js', 'client');
    api.addFiles('lib/encodeQueryData.js', 'server');

    //api.export('accountsConfig', 'client');
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
    api.export('rerenderViewportWithNewSeries', 'client');
    api.export('sortStudy', 'client');
    api.export('updateOrientationMarkers', 'client');
    api.export('setFocusToActiveViewport', 'client');
    api.export('updateAllViewports', 'client');
    api.export('exportStudies', 'client');
    api.export('importStudies', 'client');
    api.export('getActiveViewportElement', 'client');
    api.export('encodeQueryData', 'server');

    // Viewer management objects
    api.export('toolManager', 'client');
    api.export('WindowManager', 'client');

    // Global objects
    api.export('OHIF', 'client');
    api.export('ClientId', 'client');
    api.export('progressDialog', 'client');

    // Collections
    api.export('ViewerStudies', 'client');

    // UI Helpers
    api.addFiles('lib/helpers/formatDA.js', 'client');
    api.addFiles('lib/helpers/formatNumberPrecision.js', 'client');
    api.addFiles('lib/helpers/formatTM.js', 'client');
    api.addFiles('lib/helpers/inlineIf.js', 'client');

    api.addFiles('lib/helpers/formatPN.js', 'client');
    api.export('formatPN', 'client');

    api.addFiles('lib/helpers/isTouchDevice.js', 'client');
    api.export('isTouchDevice', 'client');

    // Server-side functions
    api.addFiles('server/seed.js', 'server');
    api.addFiles('server/lib/namespace.js', 'server');
    api.addFiles('server/methods/getStudyMetadata.js', 'server');
    api.addFiles('server/methods/worklistSearch.js', 'server');
    api.addFiles('server/methods/importStudies.js', 'server');

    // DICOMWeb instance, study, and metadata retrieval
    api.addFiles('server/services/qido/instances.js', 'server');
    api.addFiles('server/services/qido/studies.js', 'server');
    api.addFiles('server/services/wado/retrieveMetadata.js', 'server');

    // DIMSE instance, study, and metadata retrieval
    api.addFiles('server/services/dimse/instances.js', 'server');
    api.addFiles('server/services/dimse/studies.js', 'server');
    api.addFiles('server/services/dimse/retrieveMetadata.js', 'server');

    // Study, instance, and metadata retrieval from remote PACS via Orthanc as a proxy
    api.addFiles('server/services/remote/instances.js', 'server');
    api.addFiles('server/services/remote/studies.js', 'server');
    api.addFiles('server/services/remote/retrieveMetadata.js', 'server');    

    api.export('Services', 'server');
    api.export('importStudies', 'server');
    api.export('importSupported', 'server');

    // Collections
    api.addFiles('both/collections.js', [ 'client', 'server' ]);
    api.addFiles('server/collections.js', 'server');
    api.export('StudyImportStatus', [ 'client', 'server' ]);
});

