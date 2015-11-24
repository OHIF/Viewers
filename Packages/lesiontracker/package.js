Package.describe({
  name: "lesiontracker",
  summary: "OHIF Lesion Tracker Tools",
  version: '0.0.1'
});

Package.onUse(function (api) {
    api.versionsFrom('1.2.0.2');

    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('practicalmeteor:loglevel');

    // Our custom package
    api.use('cornerstone');

    api.addFiles('log.js', ['client', 'server']);

    api.addFiles('compatibility/lesionTool.js', 'client', {bare: true});
    api.addFiles('compatibility/nonTargetTool.js', 'client', {bare: true});
    api.addFiles('compatibility/measurementManagerDAL.js', 'client', {bare: true});

    api.addFiles('components/lesionLocationDialog/lesionLocationDialog.html', 'client');
    api.addFiles('components/lesionLocationDialog/lesionLocationDialog.js', 'client');
    api.addFiles('components/lesionLocationDialog/lesionLocationDialog.styl', 'client');
    
    api.addFiles('components/lesionTable/lesionTable.html', 'client');
    api.addFiles('components/lesionTable/lesionTable.styl', 'client');
    api.addFiles('components/lesionTable/lesionTable.js', 'client');

    api.addFiles('components/lesionTableRow/lesionTableRow.html', 'client');
    api.addFiles('components/lesionTableRow/lesionTableRow.js', 'client');

    api.addFiles('components/lesionTableTimepointCell/lesionTableTimepointCell.html', 'client');
    api.addFiles('components/lesionTableTimepointCell/lesionTableTimepointCell.js', 'client');

    api.addFiles('components/lesionTableTimepointHeader/lesionTableTimepointHeader.html', 'client');
    api.addFiles('components/lesionTableTimepointHeader/lesionTableTimepointHeader.js', 'client');

    api.addFiles('components/nonTargetLesionDialog/nonTargetLesionDialog.html', 'client');
    api.addFiles('components/nonTargetLesionDialog/nonTargetLesionDialog.css', 'client');
    api.addFiles('components/nonTargetLesionDialog/nonTargetLesionDialog.js', 'client');

    api.addFiles('components/studyDateList/studyDateList.html', 'client');
    api.addFiles('components/studyDateList/studyDateList.styl', 'client');
    api.addFiles('components/studyDateList/studyDateList.js', 'client');

    // Server functions
    api.addFiles('server/collections.js', 'server');

    // Both client and server functions
    api.addFiles('both/collections.js', ['client', 'server']);
    api.addFiles('both/removeCollections.js', ['client', 'server']);


    // Library functions
    api.addFiles('lib/uuid.js', 'client');

    api.export('Measurements', ['client', 'server']);
    api.export('Timepoints', ['client', 'server']);
});