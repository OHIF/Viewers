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

    api.addFiles('client/collections/LesionLocations.js', 'client');
    api.addFiles('client/collections/LocationResponses.js', 'client');

    api.addFiles('client/compatibility/lesionTool.js', 'client', {bare: true});
    api.addFiles('client/compatibility/nonTargetTool.js', 'client', {bare: true});
    api.addFiles('client/compatibility/biDirectionalTool.js', 'client', {bare: true});
    api.addFiles('client/compatibility/deleteLesionKeyboardTool.js', 'client', {bare: true});
    api.addFiles('client/compatibility/LesionManager.js', 'client', {bare: true});

    api.addFiles('client/components/lesionLocationDialog/lesionLocationDialog.html', 'client');
    api.addFiles('client/components/lesionLocationDialog/lesionLocationDialog.js', 'client');
    api.addFiles('client/components/lesionLocationDialog/lesionLocationDialog.styl', 'client');
    
    api.addFiles('client/components/lesionTable/lesionTable.html', 'client');
    api.addFiles('client/components/lesionTable/lesionTable.styl', 'client');
    api.addFiles('client/components/lesionTable/lesionTable.js', 'client');

    api.addFiles('client/components/lesionTableRow/lesionTableRow.html', 'client');
    api.addFiles('client/components/lesionTableRow/lesionTableRow.js', 'client');

    api.addFiles('client/components/lesionTableTimepointCell/lesionTableTimepointCell.html', 'client');
    api.addFiles('client/components/lesionTableTimepointCell/lesionTableTimepointCell.styl', 'client');
    api.addFiles('client/components/lesionTableTimepointCell/lesionTableTimepointCell.js', 'client');

    api.addFiles('client/components/lesionTableTimepointHeader/lesionTableTimepointHeader.html', 'client');
    api.addFiles('client/components/lesionTableTimepointHeader/lesionTableTimepointHeader.js', 'client');
    api.addFiles('client/components/lesionTableTimepointHeader/lesionTableTimepointHeader.styl', 'client');

    api.addFiles('client/components/nonTargetLesionDialog/nonTargetLesionDialog.html', 'client');
    api.addFiles('client/components/nonTargetLesionDialog/nonTargetLesionDialog.styl', 'client');
    api.addFiles('client/components/nonTargetLesionDialog/nonTargetLesionDialog.js', 'client');

    api.addFiles('client/components/studyDateList/studyDateList.html', 'client');
    api.addFiles('client/components/studyDateList/studyDateList.styl', 'client');
    api.addFiles('client/components/studyDateList/studyDateList.js', 'client');

    api.addFiles('client/components/confirmDeleteDialog/confirmDeleteDialog.html', 'client');
    api.addFiles('client/components/confirmDeleteDialog/confirmDeleteDialog.styl', 'client');
    api.addFiles('client/components/confirmDeleteDialog/confirmDeleteDialog.js', 'client');

    api.addFiles('client/components/nonTargetResponseDialog/nonTargetResponseDialog.html', 'client');
    api.addFiles('client/components/nonTargetResponseDialog/nonTargetResponseDialog.styl', 'client');
    api.addFiles('client/components/nonTargetResponseDialog/nonTargetResponseDialog.js', 'client');

    api.addFiles('client/components/timepointTextDialog/timepointTextDialog.html', 'client');
    api.addFiles('client/components/timepointTextDialog/timepointTextDialog.styl', 'client');

    // Server functions
    api.addFiles('server/collections.js', 'server');
    api.addFiles('server/removeCollections.js', ['server']);

    // Both client and server functions
    api.addFiles('both/collections.js', ['client', 'server']);

    // Library functions
    api.addFiles('lib/uuid.js', 'client');
    api.addFiles('lib/toggleLesionTrackerTools.js', 'client');
    api.addFiles('lib/clearMeasurementTimepointData.js', 'client');
    api.addFiles('lib/removeToolDataWithMeasurementId.js', 'client');
    api.addFiles('lib/getTimepointObject.js', 'client');
    api.addFiles('lib/activateMeasurements.js', 'client');
    api.addFiles('lib/activateLesion.js', 'client');
    api.addFiles('lib/deactivateAllToolData.js', 'client');
    api.addFiles('lib/clearTools.js', 'client');
    api.addFiles('lib/mathUtils.js', 'client');


    // Export lesionTable function for activate measurements
    api.export('activateLesion','client');
    api.export('activateMeasurements','client');
    api.export('deactivateAllToolData','client');
    api.export('toggleLesionTrackerTools', 'client');
    api.export('clearMeasurementTimepointData', 'client');
    api.export('removeToolDataWithMeasurementId', 'client');
    api.export('getTimepointObject', 'client');
    api.export('clearTools', 'client');
    api.export('LesionManager', 'client');

    // Export mathUtils functions
    api.export('sign','client');
    api.export('getLineIntersection','client');
    api.export('getDistance','client');
    api.export('getDistanceFromPointToLine','client');

    // Export client-side collections
    api.export('LesionLocations', 'client');
    api.export('LocationResponses', 'client');
    api.export('PatientLocations', 'client');

    // Export collections spanning both client and server
    api.export('Measurements', ['client', 'server']);
    api.export('Timepoints', ['client', 'server']);
});