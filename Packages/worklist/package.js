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

    // Our custom packages
    api.use('dicomweb');

    // This sets the default logging level of the package using the
    // loglevel package. It can be overridden in the JavaScript
    // console for debugging purposes
    api.addFiles('log.js', 'client');

    // Components
    api.addFiles('components/worklist.html', 'client');
    api.addFiles('components/worklist.js', 'client');
    api.addFiles('components/worklist.styl', 'client');

    api.addFiles('components/tabTitle/tabTitle.html', 'client');
    api.addFiles('components/tabTitle/tabTitle.js', 'client');
    api.addFiles('components/tabTitle/tabTitle.styl', 'client');

    api.addFiles('components/tabContent/tabContent.html', 'client');
    api.addFiles('components/tabContent/tabContent.styl', 'client');

    api.addFiles('components/worklistStudy/worklistStudy.html', 'client');
    api.addFiles('components/worklistStudy/worklistStudy.js', 'client');
    api.addFiles('components/worklistStudy/worklistStudy.styl', 'client');

    api.addFiles('components/worklistResult/worklistResult.html', 'client');
    api.addFiles('components/worklistResult/worklistResult.js', 'client');
    api.addFiles('components/worklistResult/worklistResult.styl', 'client');

    api.addFiles('lib/generateUUID.js', 'client');
    api.export('generateUUID', 'client');

    // Export Worklist helper functions for usage in Routes
    api.export('getStudyMetadata', 'client');
    api.export('openNewTab', 'client');
    api.export('switchToTab', 'client');

    // Export the global ViewerData object
    api.export('ViewerData', 'client');

    // Export the Collections
    api.export('WorklistTabs', 'client');
    api.export('WorklistStudies', 'client');
});

