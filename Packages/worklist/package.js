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

    // Components
    api.addFiles('components/worklist.html', 'client');
    api.addFiles('components/worklist.js', 'client');
    api.addFiles('components/worklist.styl', 'client');

    api.addFiles('components/worklistStudy/worklistStudy.html', 'client');
    api.addFiles('components/worklistStudy/worklistStudy.js', 'client');
    api.addFiles('components/worklistStudy/worklistStudy.styl', 'client');

    api.addFiles('components/worklistResult/worklistResult.html', 'client');
    api.addFiles('components/worklistResult/worklistResult.js', 'client');
    api.addFiles('components/worklistResult/worklistResult.styl', 'client');

    api.addFiles('components/worklistSearch/worklistSearch.html', 'client');
    api.addFiles('components/worklistSearch/worklistSearch.js', 'client');
    api.addFiles('components/worklistSearch/worklistSearch.styl', 'client');
});

