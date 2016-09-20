Package.describe({
  name: "ohif:study-list",
  summary: "Basic study list for web-based DICOM viewers",
  version: '0.0.1'
});

Package.onUse(function (api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('http');
    api.use('random');
    api.use('silentcicero:jszip');
    api.use('aldeed:simple-schema');
    api.use('accounts-base');
    api.use('mrt:moment');
    api.use('aldeed:collection2');

    // Note: MomentJS appears to be required for Bootstrap3 Datepicker, but not a dependency for some reason
    api.use('momentjs:moment');

    api.use('gilbertwat:bootstrap3-daterangepicker');

    // Our custom packages
    api.use('design');
    api.use('ohif:core');
    api.use('ohif:dicom-services');
    api.use('ohif:viewerbase');
    api.use('ohif:wadoproxy');

    // TODO: Replace with NPM dependency
    api.use('ohif:cornerstone'); // Only for HammerJS

    api.addFiles('both/collections.js', ['client', 'server']);
    api.addFiles('both/schema/servers.js', ['client', 'server']);
    api.addFiles('both/lib/getCurrentServer.js', ['client', 'server']);

    // Client collections and subscriptions
    api.addFiles('client/collections/subscriptions.js', 'client');

    // Components
    api.addFiles('client/components/studylist.html', 'client');
    api.addFiles('client/components/studylist.js', 'client');
    api.addFiles('client/components/studylist.styl', 'client');

    api.addFiles('client/components/tabTitle/tabTitle.html', 'client');
    api.addFiles('client/components/tabTitle/tabTitle.js', 'client');
    api.addFiles('client/components/tabTitle/tabTitle.styl', 'client');

    api.addFiles('client/components/studylistStudy/studylistStudy.html', 'client');
    api.addFiles('client/components/studylistStudy/studylistStudy.js', 'client');
    api.addFiles('client/components/studylistStudy/studylistStudy.styl', 'client');

    api.addFiles('client/components/studylistResult/studylistResult.html', 'client');
    api.addFiles('client/components/studylistResult/studylistResult.js', 'client');
    api.addFiles('client/components/studylistResult/studylistResult.styl', 'client');

    api.addFiles('client/components/studyContextMenu/studyContextMenu.html', 'client');
    api.addFiles('client/components/studyContextMenu/studyContextMenu.js', 'client');
    api.addFiles('client/components/studyContextMenu/studyContextMenu.styl', 'client');

    api.addFiles('client/components/studylistToolbar/studylistToolbar.html', 'client');
    api.addFiles('client/components/studylistToolbar/studylistToolbar.js', 'client');
    api.addFiles('client/components/studylistToolbar/studylistToolbar.styl', 'client');

    api.addFiles('client/components/progressDialog/progressDialog.html', 'client');
    api.addFiles('client/components/progressDialog/progressDialog.styl', 'client');
    api.addFiles('client/components/progressDialog/progressDialog.js', 'client');

    api.addFiles('client/components/studylistPagination/studylistPagination.html', 'client');
    api.addFiles('client/components/studylistPagination/studylistPagination.styl', 'client');
    api.addFiles('client/components/studylistPagination/studylistPagination.js', 'client');

    api.addFiles('client/components/viewSeriesDetailsModal/viewSeriesDetailsModal.html', 'client');

    api.addFiles('client/components/seriesDetailsTable/seriesDetailsTable.html', 'client');
    api.addFiles('client/components/seriesDetailsTable/seriesDetailsTable.styl', 'client');
    api.addFiles('client/components/seriesDetailsTable/seriesDetailsTable.js', 'client');

    api.addFiles('client/components/serverInformation/serverInformationDicomWeb/serverInformationDicomWeb.html', 'client');
    api.addFiles('client/components/serverInformation/serverInformationDicomWeb/serverInformationDicomWeb.js', 'client');

    api.addFiles('client/components/serverInformation/serverInformationDimse/serverInformationDimse.html', 'client');
    api.addFiles('client/components/serverInformation/serverInformationDimse/serverInformationDimse.js', 'client');

    api.addFiles('client/components/serverInformation/serverInformationForm/serverInformationForm.html', 'client');
    api.addFiles('client/components/serverInformation/serverInformationForm/serverInformationForm.js', 'client');
    api.addFiles('client/components/serverInformation/serverInformationForm/serverInformationFormField.html', 'client');

    api.addFiles('client/components/serverInformation/serverInformationList/serverInformationList.html', 'client');
    api.addFiles('client/components/serverInformation/serverInformationList/serverInformationList.js', 'client');

    api.addFiles('client/components/serverInformation/serverInformationModal/serverInformationModal.html', 'client');
    api.addFiles('client/components/serverInformation/serverInformationModal/serverInformationModal.styl', 'client');
    api.addFiles('client/components/serverInformation/serverInformationModal/serverInformationModal.js', 'client');

    // Client-side library functions
    api.addFiles('client/lib/getStudyMetadata.js', 'client');
    api.addFiles('client/lib/getStudiesMetadata.js', 'client');
    api.addFiles('client/lib/openNewTab.js', 'client');
    api.addFiles('client/lib/switchToTab.js', 'client');
    api.addFiles('client/lib/exportStudies.js', 'client');
    api.addFiles('client/lib/studylist.js', 'client');
    api.addFiles('client/lib/queryStudies.js', 'client');
    api.addFiles('client/lib/importStudies.js', 'client');
    api.addFiles('client/lib/jquery.twbsPagination/jquery.twbsPagination.min.js', 'client');

    // Server-side functions
    api.addFiles('server/publications.js', 'server');
    api.addFiles('server/validateServerConfiguration.js', 'server');
    api.addFiles('server/servers.js', 'server');
    api.addFiles('server/lib/remoteGetValue.js', 'server');
    api.addFiles('server/lib/encodeQueryData.js', 'server');
    api.addFiles('server/lib/parseFloatArray.js', 'server');

    api.addFiles('server/methods/getStudyMetadata.js', 'server');
    api.addFiles('server/methods/importStudies.js', 'server');
    api.addFiles('server/methods/studylistSearch.js', 'server');

    api.addFiles('server/services/namespace.js', 'server');

    // DICOMWeb instance, study, and metadata retrieval
    api.addFiles('server/services/qido/instances.js', 'server');
    api.addFiles('server/services/qido/studies.js', 'server');
    api.addFiles('server/services/wado/retrieveMetadata.js', 'server');

    // DIMSE instance, study, and metadata retrieval
    api.addFiles('server/services/dimse/instances.js', 'server');
    api.addFiles('server/services/dimse/studies.js', 'server');
    api.addFiles('server/services/dimse/retrieveMetadata.js', 'server');
    api.addFiles('server/services/dimse/setup.js', 'server');

    // Study, instance, and metadata retrieval from remote PACS via Orthanc as a proxy
    api.addFiles('server/services/remote/instances.js', 'server');
    api.addFiles('server/services/remote/studies.js', 'server');
    api.addFiles('server/services/remote/retrieveMetadata.js', 'server');

    // Export Servers and CurrentServer Collections
    api.export('Servers', ['client', 'server']);
    api.export('CurrentServer', ['client', 'server']);

    // Export shared lib functions
    api.export('getCurrentServer', ['client', 'server']);

    api.export('Services', 'server');

    // Export StudyList helper functions for usage in Routes
    api.export('getStudyMetadata', 'client');
    api.export('getStudiesMetadata', 'client');
    api.export('openNewTab', 'client');
    api.export('switchToTab', 'client');
    api.export('progressDialog', 'client');
    api.export('StudyList');

    // Export the global ViewerData object
    api.export('ViewerData', 'client');

    // Export the Collections
    api.export('StudyListStudies', 'client');
    api.export('StudyListSelectedStudies', 'client')
});
