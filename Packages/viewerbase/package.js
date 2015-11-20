Package.describe({
  name: "viewerbase",
  summary: "Shared components and functions for Meteor DICOM Viewers",
  version: '0.0.1'
});

Package.onUse(function (api) {
    api.versionsFrom('1.2.0.2');

    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('accounts-password');
    api.use('ian:accounts-ui-bootstrap-3');
    api.use('http');
    api.use('practicalmeteor:loglevel');
    api.use('momentjs:moment');

    // Our custom package
    api.use('cornerstone');
    api.use('hangingprotocols');

    api.addFiles('log.js', ['client', 'server']);

    // ---------- Components ----------

    // Basic components
    api.addFiles('components/basic/layout/layout.html', 'client');
    api.addFiles('components/basic/layout/layout.styl', 'client');
    api.addFiles('components/basic/login/login.html', 'client');
    api.addFiles('components/basic/notFound/notFound.html', 'client');

    api.addFiles('components/basic/loadingText/loadingText.html', 'client');
    api.addFiles('components/basic/loadingText/loadingText.styl', 'client');

    api.addFiles('components/basic/removableBackdrop/removableBackdrop.html', 'client');
    api.addFiles('components/basic/removableBackdrop/removableBackdrop.styl', 'client');

    api.addFiles('components/basic/hidingPanel/hidingPanel.html', 'client');
    api.addFiles('components/basic/hidingPanel/hidingPanel.js', 'client');
    api.addFiles('components/basic/hidingPanel/hidingPanel.styl', 'client');

    // Study Browser components
    api.addFiles('components/studyBrowser/studyBrowser/studyBrowser.html', 'client');
    api.addFiles('components/studyBrowser/studyBrowser/studyBrowser.js', 'client');
    api.addFiles('components/studyBrowser/studyBrowser/studyBrowser.styl', 'client');

    api.addFiles('components/studyBrowser/thumbnailEntry/thumbnailEntry.html', 'client');
    api.addFiles('components/studyBrowser/thumbnailEntry/thumbnailEntry.js', 'client');
    api.addFiles('components/studyBrowser/thumbnailEntry/thumbnailEntry.styl', 'client');

    api.addFiles('components/studyBrowser/thumbnails/thumbnails.html', 'client');
    api.addFiles('components/studyBrowser/thumbnails/thumbnails.js', 'client');

    api.addFiles('components/studyBrowser/imageThumbnail/imageThumbnail.html', 'client');
    api.addFiles('components/studyBrowser/imageThumbnail/imageThumbnail.js', 'client');
    api.addFiles('components/studyBrowser/imageThumbnail/imageThumbnail.styl', 'client');

    // Viewer components
    api.addFiles('components/viewer/imageViewerViewport/imageViewerViewport.html', 'client');
    api.addFiles('components/viewer/imageViewerViewport/imageViewerViewport.js', 'client');
    api.addFiles('components/viewer/imageViewerViewport/imageViewerViewport.styl', 'client');

    api.addFiles('components/viewer/imageViewerViewports/imageViewerViewports.html', 'client');
    api.addFiles('components/viewer/imageViewerViewports/imageViewerViewports.js', 'client');
    api.addFiles('components/viewer/imageViewerViewports/imageViewerViewports.styl', 'client');

    api.addFiles('components/viewer/loadingIndicator/loadingIndicator.html', 'client');
    api.addFiles('components/viewer/loadingIndicator/loadingIndicator.js', 'client');
    api.addFiles('components/viewer/loadingIndicator/loadingIndicator.styl', 'client');

    api.addFiles('components/viewer/viewportOrientationMarkers/viewportOrientationMarkers.html', 'client');
    api.addFiles('components/viewer/viewportOrientationMarkers/viewportOrientationMarkers.js', 'client');
    api.addFiles('components/viewer/viewportOrientationMarkers/viewportOrientationMarkers.styl', 'client');

    api.addFiles('components/viewer/viewportOverlay/viewportOverlay.html', 'client');
    api.addFiles('components/viewer/viewportOverlay/viewportOverlay.js', 'client');
    api.addFiles('components/viewer/viewportOverlay/viewportOverlay.styl', 'client');

    api.addFiles('components/viewer/layoutChooser/layoutChooser.html', 'client');
    api.addFiles('components/viewer/layoutChooser/layoutChooser.js', 'client');
    api.addFiles('components/viewer/layoutChooser/layoutChooser.styl', 'client');

    api.addFiles('components/viewer/simpleToolbarButton/simpleToolbarButton.html', 'client');

    api.addFiles('components/viewer/playClipButton/playClipButton.html', 'client');
    api.addFiles('components/viewer/playClipButton/playClipButton.js', 'client');

    api.addFiles('components/viewer/hangingProtocolButtons/hangingProtocolButtons.html', 'client');
    api.addFiles('components/viewer/hangingProtocolButtons/hangingProtocolButtons.js', 'client');

    api.addFiles('components/viewer/layoutButton/layoutButton.html', 'client');

    api.addFiles('components/viewer/toolbar/toolbar.html', 'client');
    api.addFiles('components/viewer/toolbar/toolbar.js', 'client');
    api.addFiles('components/viewer/toolbar/toolbar.styl', 'client');

    // Library functions
    api.addFiles('lib/accountsConfig.js', 'client');
    api.addFiles('lib/createStacks.js', 'client');
    api.addFiles('lib/encodeQueryData.js', ['client', 'server']);
    api.addFiles('lib/getImageId.js', 'client');
    api.addFiles('lib/getWADORSImageId.js', 'client');
    api.addFiles('lib/isTouchDevice.js', 'client');
    api.addFiles('lib/metaDataProvider.js', 'client');
    api.addFiles('lib/rerenderViewportWithNewSeries.js', 'client');
    api.addFiles('lib/sortStudy.js', 'client');
    api.addFiles('lib/toolManager.js', 'client');
    api.addFiles('lib/windowManager.js', 'client');

    //api.export('accountsConfig', 'client');
    api.export('createStacks', 'client');
    api.export('encodeQueryData', ['client', 'server']);
    api.export('getImageId', 'client');
    api.export('getWADORSImageId', 'client');
    api.export('isTouchDevice', 'client');
    api.export('metaDataProvider', 'client');
    api.export('rerenderViewportWithNewSeries', 'client');
    api.export('sortStudy', 'client');
    api.export('updateOrientationMarkers', 'client');

    // Viewer management objects
    api.export('toolManager', 'client');
    api.export('WindowManager', 'client');


    // UI Helpers
    api.addFiles('lib/helpers/formatDA.js', 'client');
    api.addFiles('lib/helpers/formatNumberPrecision.js', 'client');
    api.addFiles('lib/helpers/formatPN.js', 'client');
    api.addFiles('lib/helpers/formatTM.js', 'client');

    // Server-side functions
    api.addFiles('server/seed.js', 'server');
    api.addFiles('server/lib/namespace.js', 'server');
    api.addFiles('server/methods/getStudyMetadata.js', 'server');
    api.addFiles('server/methods/worklistSearch.js', 'server');
    api.addFiles('server/services/qido/instances.js', 'server');
    api.addFiles('server/services/qido/studies.js', 'server');
    api.addFiles('server/services/wado/retrieveMetadata.js', 'server');
    api.export('Services', 'server');
});

