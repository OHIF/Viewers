Package.describe({
    name: 'ohif:measurements',
    summary: 'OHIF Measurement Tools',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.4');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('random');

    api.use('validatejs');

    // Schema for Data Models
    api.use('aldeed:simple-schema');
    api.use('aldeed:collection2');

    // Template overriding
    api.use('aldeed:template-extension@4.0.0');

    // Our custom packages
    api.use('ohif:cornerstone');
    api.use('design');
    api.use('ohif:core');
    api.use('ohif:log');
    api.use('ohif:study-list');

    api.addFiles('both/schema/measurements.js', ['client', 'server']);
    api.addFiles('both/schema/timepoints.js', ['client', 'server']);

    api.addFiles('both/configuration/measurements.js', ['client', 'server']);
    api.addFiles('both/configuration/timepoints.js', ['client', 'server']);

    // Client imports and routes
    api.addFiles('client/index.js', 'client');

    // Measurement Table Components
    api.addFiles('client/components/measurementTable/measurementTable.html', 'client');
    api.addFiles('client/components/measurementTable/measurementTable.styl', 'client');
    api.addFiles('client/components/measurementTable/measurementTable.js', 'client');

    api.addFiles('client/components/measurementTable/measurementTableView/measurementTableView.html', 'client');
    api.addFiles('client/components/measurementTable/measurementTableView/measurementTableView.styl', 'client');
    api.addFiles('client/components/measurementTable/measurementTableView/measurementTableView.js', 'client');

    api.addFiles('client/components/measurementTable/measurementTableHUD/measurementTableHUD.html', 'client');
    api.addFiles('client/components/measurementTable/measurementTableHUD/measurementTableHUD.styl', 'client');
    api.addFiles('client/components/measurementTable/measurementTableHUD/measurementTableHUD.js', 'client');

    api.addFiles('client/components/measurementTable/measurementTableRow/measurementTableRow.html', 'client');
    api.addFiles('client/components/measurementTable/measurementTableRow/measurementTableRow.styl', 'client');
    api.addFiles('client/components/measurementTable/measurementTableRow/measurementTableRow.js', 'client');

    api.addFiles('client/components/measurementTable/measurementTableHeaderRow/measurementTableHeaderRow.html', 'client');
    api.addFiles('client/components/measurementTable/measurementTableHeaderRow/measurementTableHeaderRow.styl', 'client');
    api.addFiles('client/components/measurementTable/measurementTableHeaderRow/measurementTableHeaderRow.js', 'client');

    api.addFiles('client/components/measurementTable/measurementTableTimepointCell/measurementTableTimepointCell.html', 'client');
    api.addFiles('client/components/measurementTable/measurementTableTimepointCell/measurementTableTimepointCell.styl', 'client');
    api.addFiles('client/components/measurementTable/measurementTableTimepointCell/measurementTableTimepointCell.js', 'client');

    api.addFiles('client/components/measurementTable/measurementTableTimepointHeader/measurementTableTimepointHeader.html', 'client');
    api.addFiles('client/components/measurementTable/measurementTableTimepointHeader/measurementTableTimepointHeader.styl', 'client');
    api.addFiles('client/components/measurementTable/measurementTableTimepointHeader/measurementTableTimepointHeader.js', 'client');

    // Longitudinal Components
    api.addFiles('client/components/longitudinal/longitudinalStudyListStudy/longitudinalStudyListStudy.html', 'client');
    api.addFiles('client/components/longitudinal/longitudinalStudyListStudy/longitudinalStudyListStudy.styl', 'client');
    api.addFiles('client/components/longitudinal/longitudinalStudyListStudy/longitudinalStudyListStudy.js', 'client');

    api.addFiles('client/components/longitudinal/longitudinalStudyListContextMenu/longitudinalStudyListContextMenu.html', 'client');
    api.addFiles('client/components/longitudinal/longitudinalStudyListContextMenu/longitudinalStudyListContextMenu.js', 'client');

    api.addFiles('client/components/longitudinal/longitudinalViewportOverlay/longitudinalViewportOverlay.html', 'client');
    api.addFiles('client/components/longitudinal/longitudinalViewportOverlay/longitudinalViewportOverlay.js', 'client');

    // Case Progress
    api.addFiles('client/components/caseProgress/caseProgress.html', 'client');
    api.addFiles('client/components/caseProgress/caseProgress.styl', 'client');
    api.addFiles('client/components/caseProgress/caseProgress.js', 'client');

    api.addFiles('client/components/caseProgress/radialProgressBar/radialProgressBar.html', 'client');
    api.addFiles('client/components/caseProgress/radialProgressBar/radialProgressBar.styl', 'client');
    api.addFiles('client/components/caseProgress/radialProgressBar/radialProgressBar.js', 'client');

    // Study-Timepoint Association
    api.addFiles('client/components/association/associationModal/associationModal.html', 'client');
    api.addFiles('client/components/association/associationModal/associationModal.styl', 'client');
    api.addFiles('client/components/association/associationModal/associationModal.js', 'client');

    api.addFiles('client/components/association/associationModal/studyAssociationTable/studyAssociationTable.html', 'client');
    api.addFiles('client/components/association/associationModal/studyAssociationTable/studyAssociationTable.styl', 'client');
    api.addFiles('client/components/association/associationModal/studyAssociationTable/studyAssociationTable.js', 'client');

    api.addFiles('client/components/association/confirmRemoveTimepointAssociation/confirmRemoveTimepointAssociation.html', 'client');
    api.addFiles('client/components/association/confirmRemoveTimepointAssociation/confirmRemoveTimepointAssociation.js', 'client');

    api.export('MeasurementSchemaTypes', ['client', 'server']);
});
