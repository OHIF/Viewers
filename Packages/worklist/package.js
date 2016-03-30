Package.describe({
  name: "worklist",
  summary: "Basic worklist for web-based DICOM viewers",
  version: '0.0.1'
});

Package.onUse(function (api) {
    api.versionsFrom('1.2.0.2');

    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('http');
    api.use('practicalmeteor:loglevel');
    api.use('rwatts:uuid');
    api.use('silentcicero:jszip');

    // Our custom packages
    api.use('dicomweb');

    // This sets the default logging level of the package using the
    // loglevel package. It can be overridden in the JavaScript
    // console for debugging purposes
    api.addFiles('log.js', 'client');

    // Components
    api.addFiles('client/components/worklist.html', 'client');
    api.addFiles('client/components/worklist.js', 'client');
    api.addFiles('client/components/worklist.styl', 'client');

    api.addFiles('client/components/tabTitle/tabTitle.html', 'client');
    api.addFiles('client/components/tabTitle/tabTitle.js', 'client');
    api.addFiles('client/components/tabTitle/tabTitle.styl', 'client');

    api.addFiles('client/components/tabContent/tabContent.html', 'client');
    api.addFiles('client/components/tabContent/tabContent.styl', 'client');

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

    // Library functions
    api.addFiles('lib/getStudyMetadata.js', 'client');
    api.addFiles('lib/getStudiesMetadata.js', 'client');
    api.addFiles('lib/openNewTab.js', 'client');
    api.addFiles('lib/switchToTab.js', 'client');
    api.addFiles('lib/worklist.js', 'client');

    // Export Worklist helper functions for usage in Routes
    api.export('getTimepointName', 'client');
    api.export('getStudyMetadata', 'client');
    api.export('getStudiesMetadata', 'client');
    api.export('openNewTab', 'client');
    api.export('setWorklistSubscriptions', 'client');
    api.export('switchToTab', 'client');
    api.export('Worklist');

    // Export the global ViewerData object
    api.export('ViewerData', 'client');

    // Export the Collections
    api.export('WorklistTabs', 'client');
    api.export('WorklistStudies', 'client');
    api.export('WorklistSelectedStudies', 'client');
});