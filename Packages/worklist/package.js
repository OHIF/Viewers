Package.describe({
  name: "worklist",
  summary: "Basic worklist for web-based DICOM viewers",
  version: '0.0.1'
});

Package.onUse(function (api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('http');
    api.use('practicalmeteor:loglevel');
    api.use('rwatts:uuid');
    api.use('silentcicero:jszip');
    api.use('aldeed:simple-schema');

    // Note: MomentJS appears to be required for Bootstrap3 Datepicker, but not a dependency for some reason
    api.use('momentjs:moment');

    api.use('gilbertwat:bootstrap3-daterangepicker');    

    // Our custom packages
    api.use('ohif:core');
    api.use('design');
    api.use('dicomweb');
    api.use('dimseservice');
    api.use('orthanc-remote');
    api.use('viewerbase');
    api.use('wadoproxy');

    // TODO: Replace with NPM dependency
    api.use('cornerstone'); // Only for HammerJS

    // This sets the default logging level of the package using the
    // loglevel package. It can be overridden in the JavaScript
    // console for debugging purposes
    api.addFiles('log.js');

    api.addFiles('both/collections.js', [ 'client', 'server' ]);
    api.addFiles('both/schema.js', [ 'client', 'server' ]);
    
    // Components
    api.addFiles('client/components/worklist.html', 'client');
    api.addFiles('client/components/worklist.js', 'client');
    api.addFiles('client/components/worklist.styl', 'client');

    api.addFiles('client/components/tabTitle/tabTitle.html', 'client');
    api.addFiles('client/components/tabTitle/tabTitle.js', 'client');
    api.addFiles('client/components/tabTitle/tabTitle.styl', 'client');

    api.addFiles('client/components/worklistStudy/worklistStudy.html', 'client');
    api.addFiles('client/components/worklistStudy/worklistStudy.js', 'client');
    api.addFiles('client/components/worklistStudy/worklistStudy.styl', 'client');

    api.addFiles('client/components/worklistResult/worklistResult.html', 'client');
    api.addFiles('client/components/worklistResult/worklistResult.js', 'client');
    api.addFiles('client/components/worklistResult/worklistResult.styl', 'client');

    api.addFiles('client/components/studyContextMenu/studyContextMenu.html', 'client');
    api.addFiles('client/components/studyContextMenu/studyContextMenu.js', 'client');
    api.addFiles('client/components/studyContextMenu/studyContextMenu.styl', 'client');

    api.addFiles('client/components/worklistToolbar/worklistToolbar.html', 'client');
    api.addFiles('client/components/worklistToolbar/worklistToolbar.js', 'client');
    api.addFiles('client/components/worklistToolbar/worklistToolbar.styl', 'client');

    api.addFiles('client/components/progressDialog/progressDialog.html', 'client');
    api.addFiles('client/components/progressDialog/progressDialog.styl', 'client');
    api.addFiles('client/components/progressDialog/progressDialog.js', 'client');

    api.addFiles('client/components/worklistPagination/worklistPagination.html', 'client');
    api.addFiles('client/components/worklistPagination/worklistPagination.styl', 'client');
    api.addFiles('client/components/worklistPagination/worklistPagination.js', 'client');

    api.addFiles('client/components/viewSeriesDetailsModal/viewSeriesDetailsModal.html', 'client');

    api.addFiles('client/components/seriesDetailsTable/seriesDetailsTable.html', 'client');
    api.addFiles('client/components/seriesDetailsTable/seriesDetailsTable.styl', 'client');
    api.addFiles('client/components/seriesDetailsTable/seriesDetailsTable.js', 'client');
    
    // Client-side library functions
    api.addFiles('client/lib/getStudyMetadata.js', 'client');
    api.addFiles('client/lib/getStudiesMetadata.js', 'client');
    api.addFiles('client/lib/openNewTab.js', 'client');
    api.addFiles('client/lib/switchToTab.js', 'client');
    api.addFiles('client/lib/exportStudies.js', 'client');
    api.addFiles('client/lib/worklist.js', 'client');
    api.addFiles('client/lib/queryStudies.js', 'client');
    api.addFiles('client/lib/importStudies.js', 'client');
    api.addFiles('client/lib/jquery.twbsPagination/jquery.twbsPagination.min.js', 'client');

    // Server-side functions
    api.addFiles('server/publications.js', 'server');
    api.addFiles('server/validateServerConfiguration.js', 'server');
    api.addFiles('server/lib/remoteGetValue.js', 'server');
    api.addFiles('server/lib/encodeQueryData.js', 'server');

    api.addFiles('server/methods/getStudyMetadata.js', 'server');
    api.addFiles('server/methods/importStudies.js', 'server');
    api.addFiles('server/methods/worklistSearch.js', 'server');

    api.addFiles('server/services/namespace.js', 'server');

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

    // Export Worklist helper functions for usage in Routes
    api.export('getStudyMetadata', 'client');
    api.export('getStudiesMetadata', 'client');
    api.export('openNewTab', 'client');
    api.export('switchToTab', 'client');
    api.export('progressDialog', 'client');
    api.export('Worklist');

    // Export the global ViewerData object
    api.export('ViewerData', 'client');

    // Export the Collections
    api.export('WorklistTabs', 'client');
    api.export('WorklistStudies', 'client');
    api.export('WorklistSelectedStudies', 'client')
});