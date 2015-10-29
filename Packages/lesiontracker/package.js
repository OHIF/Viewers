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

    // Our custom package
    api.use('cornerstone');

    api.addFiles('compatibility/lesionTool.js', 'client', {bare: true});
    api.addFiles('compatibility/measurementManagerDAL.js', 'client', {bare: true});

    api.addFiles('components/lesionDialog/lesionDialog.html', 'client');
    api.addFiles('components/lesionDialog/lesionDialog.js', 'client');

    api.addFiles('components/lesionLocationDialog/lesionLocationDialog.html', 'client');
    api.addFiles('components/lesionLocationDialog/lesionLocationDialog.js', 'client');
    
    api.addFiles('components/lesionTable/lesionTable.html', 'client');
    api.addFiles('components/lesionTable/lesionTable.styl', 'client');
    api.addFiles('components/lesionTable/lesionTable.js', 'client');

    api.addFiles('components/lesionTableRow/lesionTableRow.html', 'client');
    api.addFiles('components/lesionTableRow/lesionTableRow.js', 'client');

    api.addFiles('components/lesionTableTimepointCell/lesionTableTimepointCell.html', 'client');
    api.addFiles('components/lesionTableTimepointCell/lesionTableTimepointCell.js', 'client');

    api.addFiles('components/lesionTableTimepointHeader/lesionTableTimepointHeader.html', 'client');
    api.addFiles('components/lesionTableTimepointHeader/lesionTableTimepointHeader.js', 'client');


    // Library functions
    api.addFiles('lib/getActiveTimepointID.js', 'client');
    api.addFiles('lib/uuid.js', 'client');

});