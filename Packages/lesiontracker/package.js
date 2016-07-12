Package.describe({
    name: 'lesiontracker',
    summary: 'OHIF Lesion Tracker Tools',
    version: '0.0.1'
});

Package.onUse(function(api) {
    api.versionsFrom('1.3.4.1');

    api.use('ecmascript');
    api.use('standard-app-packages');
    api.use('jquery');
    api.use('stylus');
    api.use('design');

    api.use('validatejs');

    // Schema for Data Models
    api.use('aldeed:simple-schema');

    // Control over logging
    api.use('practicalmeteor:loglevel');

    // Unique IDs
    api.use('rwatts:uuid');

    // Template overriding
    api.use('aldeed:template-extension@4.0.0');

    // Our custom packages
    api.use('worklist');
    api.use('cornerstone');
    api.use('reactive-form-controls');

    api.addFiles('log.js', [ 'client', 'server' ]);

    // Schema
    api.addFiles('both/schema/additionalFindings.js', [ 'client', 'server' ]);

    // Client-side collections
    api.addFiles('client/collections/LesionLocations.js', 'client');
    api.addFiles('client/collections/LocationResponses.js', 'client');
    api.addFiles('client/collections/subscriptions.js', 'client');

    // Additional Custom Cornerstone Tools for Lesion Tracker
    api.addFiles([
        'client/compatibility/bidirectionalTool.js',
        'client/compatibility/nonTargetTool.js',
        'client/compatibility/scaleOverlayTool.js',
        'client/compatibility/deleteLesionKeyboardTool.js',
        'client/compatibility/crunexTool.js',
        'client/compatibility/crTool.js',
        'client/compatibility/unTool.js',
        'client/compatibility/exTool.js'
    ], 'client', {
        bare: true
    });

    api.addAssets('assets/icons.svg', 'client');

    // UI Components
    api.addFiles('client/components/viewer/viewer.html', 'client');
    api.addFiles('client/components/viewer/viewer.styl', 'client');
    api.addFiles('client/components/viewer/viewer.js', 'client');

    api.addFiles('client/components/flexboxLayout/flexboxLayout.html', 'client');
    api.addFiles('client/components/flexboxLayout/flexboxLayout.styl', 'client');
    api.addFiles('client/components/flexboxLayout/flexboxLayout.js', 'client');

    api.addFiles('client/components/toolbarSectionButton/toolbarSectionButton.html', 'client');
    api.addFiles('client/components/toolbarSectionButton/toolbarSectionButton.styl', 'client');
    api.addFiles('client/components/toolbarSectionButton/toolbarSectionButton.js', 'client');

    api.addFiles('client/components/toolbarSection/toolbarSection.html', 'client');
    api.addFiles('client/components/toolbarSection/toolbarSection.styl', 'client');
    api.addFiles('client/components/toolbarSection/toolbarSection.js', 'client');

    api.addFiles('client/components/radialProgressBar/radialProgressBar.html', 'client');
    api.addFiles('client/components/radialProgressBar/radialProgressBar.styl', 'client');
    api.addFiles('client/components/radialProgressBar/radialProgressBar.js', 'client');

    api.addFiles('client/components/caseProgress/caseProgress.html', 'client');
    api.addFiles('client/components/caseProgress/caseProgress.styl', 'client');
    api.addFiles('client/components/caseProgress/caseProgress.js', 'client');

    api.addFiles('client/components/viewerMain/viewerMain.html', 'client');
    api.addFiles('client/components/viewerMain/viewerMain.styl', 'client');
    api.addFiles('client/components/viewerMain/viewerMain.js', 'client');

    api.addFiles('client/components/lesionTracker/lesionTracker.html', 'client');
    api.addFiles('client/components/lesionTracker/lesionTracker.styl', 'client');
    api.addFiles('client/components/lesionTracker/lesionTracker.js', 'client');

    api.addFiles('client/components/lesionTrackerLayout/lesionTrackerLayout.html', 'client');

    api.addFiles('client/components/additionalFindings/additionalFindings.html', 'client');
    api.addFiles('client/components/additionalFindings/additionalFindings.styl', 'client');
    api.addFiles('client/components/additionalFindings/additionalFindings.js', 'client');

    api.addFiles('client/components/studySeriesQuickSwitch/studySeriesQuickSwitch.html', 'client');
    api.addFiles('client/components/studySeriesQuickSwitch/studySeriesQuickSwitch.styl', 'client');
    api.addFiles('client/components/studySeriesQuickSwitch/studySeriesQuickSwitch.js', 'client');

    api.addFiles('client/components/associationModal/associationModal.html', 'client');
    api.addFiles('client/components/associationModal/associationModal.styl', 'client');
    api.addFiles('client/components/associationModal/associationModal.js', 'client');

    api.addFiles('client/components/activeEntry/activeEntry.styl', 'client');
    api.addFiles('client/components/activeEntry/activeEntry.js', 'client');

    api.addFiles('client/components/hipaaLogPage/hipaaLogPage.styl', 'client');
    api.addFiles('client/components/hipaaLogPage/hipaaLogPage.js', 'client');

    api.addFiles('client/components/optionsModal/optionsModal.html', 'client');
    api.addFiles('client/components/optionsModal/optionsModal.styl', 'client');
    api.addFiles('client/components/optionsModal/optionsModal.js', 'client');

    api.addFiles('client/components/recistDescription/recistDescription.html', 'client');
    api.addFiles('client/components/irRCDescription/irRCDescription.html', 'client');

    api.addFiles('client/components/lesionLocationDialog/lesionLocationDialog.html', 'client');
    api.addFiles('client/components/lesionLocationDialog/lesionLocationDialog.js', 'client');
    api.addFiles('client/components/lesionLocationDialog/lesionLocationDialog.styl', 'client');

    api.addFiles('client/components/lesionTableView/lesionTableView.html', 'client');
    api.addFiles('client/components/lesionTableView/lesionTableView.styl', 'client');
    api.addFiles('client/components/lesionTableView/lesionTableView.js', 'client');

    api.addFiles('client/components/lesionTable/lesionTable.html', 'client');
    api.addFiles('client/components/lesionTable/lesionTable.styl', 'client');
    api.addFiles('client/components/lesionTable/lesionTable.js', 'client');

    api.addFiles('client/components/lesionTableHUD/lesionTableHUD.html', 'client');
    api.addFiles('client/components/lesionTableHUD/lesionTableHUD.styl', 'client');
    api.addFiles('client/components/lesionTableHUD/lesionTableHUD.js', 'client');

    api.addFiles('client/components/lesionTableRow/lesionTableRow.html', 'client');
    api.addFiles('client/components/lesionTableRow/lesionTableRow.styl', 'client');
    api.addFiles('client/components/lesionTableRow/lesionTableRow.js', 'client');

    api.addFiles('client/components/lesionTableHeaderRow/lesionTableHeaderRow.html', 'client');
    api.addFiles('client/components/lesionTableHeaderRow/lesionTableHeaderRow.styl', 'client');
    api.addFiles('client/components/lesionTableHeaderRow/lesionTableHeaderRow.js', 'client');

    api.addFiles('client/components/lesionTableTimepointCell/lesionTableTimepointCell.html', 'client');
    api.addFiles('client/components/lesionTableTimepointCell/lesionTableTimepointCell.styl', 'client');
    api.addFiles('client/components/lesionTableTimepointCell/lesionTableTimepointCell.js', 'client');

    api.addFiles('client/components/lesionTableTimepointHeader/lesionTableTimepointHeader.html', 'client');
    api.addFiles('client/components/lesionTableTimepointHeader/lesionTableTimepointHeader.styl', 'client');
    api.addFiles('client/components/lesionTableTimepointHeader/lesionTableTimepointHeader.js', 'client');

    api.addFiles('client/components/nonTargetLesionDialog/nonTargetLesionDialog.html', 'client');
    api.addFiles('client/components/nonTargetLesionDialog/nonTargetLesionDialog.styl', 'client');
    api.addFiles('client/components/nonTargetLesionDialog/nonTargetLesionDialog.js', 'client');

    api.addFiles('client/components/studyTimepointBrowser/studyTimepoint.html', 'client');
    api.addFiles('client/components/studyTimepointBrowser/studyTimepoint.styl', 'client');
    api.addFiles('client/components/studyTimepointBrowser/studyTimepoint.js', 'client');

    api.addFiles('client/components/studyTimepointBrowser/studyTimepointBrowser.html', 'client');
    api.addFiles('client/components/studyTimepointBrowser/studyTimepointBrowser.styl', 'client');
    api.addFiles('client/components/studyTimepointBrowser/studyTimepointBrowser.js', 'client');

    api.addFiles('client/components/studyTimepointBrowser/studyTimepointStudy.html', 'client');
    api.addFiles('client/components/studyTimepointBrowser/studyTimepointStudy.styl', 'client');
    api.addFiles('client/components/studyTimepointBrowser/studyTimepointStudy.js', 'client');

    api.addFiles('client/components/studyAssociationTable/studyAssociationTable.html', 'client');
    api.addFiles('client/components/studyAssociationTable/studyAssociationTable.styl', 'client');
    api.addFiles('client/components/studyAssociationTable/studyAssociationTable.js', 'client');

    api.addFiles('client/components/conformanceCheckFeedback/conformanceCheckFeedback.html', 'client');
    api.addFiles('client/components/conformanceCheckFeedback/conformanceCheckFeedback.styl', 'client');
    api.addFiles('client/components/conformanceCheckFeedback/conformanceCheckFeedback.js', 'client');

    api.addFiles('client/components/nonTargetResponseDialog/nonTargetResponseDialog.html', 'client');
    api.addFiles('client/components/nonTargetResponseDialog/nonTargetResponseDialog.styl', 'client');
    api.addFiles('client/components/nonTargetResponseDialog/nonTargetResponseDialog.js', 'client');

    api.addFiles('client/components/lesionTrackerWorklistStudy/lesionTrackerWorklistStudy.html', 'client');
    api.addFiles('client/components/lesionTrackerWorklistStudy/lesionTrackerWorklistStudy.styl', 'client');
    api.addFiles('client/components/lesionTrackerWorklistStudy/lesionTrackerWorklistStudy.js', 'client');

    api.addFiles('client/components/timeoutCountdownDialog/timeoutCountdownDialog.html', 'client');
    api.addFiles('client/components/timeoutCountdownDialog/timeoutCountdownDialog.styl', 'client');
    api.addFiles('client/components/timeoutCountdownDialog/timeoutCountdownDialog.js', 'client');

    api.addFiles('client/components/lesionTrackerWorklistContextMenu/lesionTrackerWorklistContextMenu.html', 'client');
    api.addFiles('client/components/lesionTrackerWorklistContextMenu/lesionTrackerWorklistContextMenu.js', 'client');

    api.addFiles('client/components/lesionTrackerViewportOverlay/lesionTrackerViewportOverlay.html', 'client');
    api.addFiles('client/components/lesionTrackerViewportOverlay/lesionTrackerViewportOverlay.styl', 'client');
    api.addFiles('client/components/lesionTrackerViewportOverlay/lesionTrackerViewportOverlay.js', 'client');

    api.addFiles('client/components/serverInformationModal/serverInformationModal.html', 'client');
    api.addFiles('client/components/serverInformationModal/serverInformationModal.styl', 'client');
    api.addFiles('client/components/serverInformationModal/serverInformationModal.js', 'client');

    api.addFiles('client/components/userAccountMenu/userAccountMenu.html', 'client');
    api.addFiles('client/components/userAccountMenu/userAccountMenu.styl', 'client');
    api.addFiles('client/components/userAccountMenu/userAccountMenu.js', 'client');

    api.addFiles('client/components/confirmRemoveTimepointAssociation/confirmRemoveTimepointAssociation.html', 'client');
    api.addFiles('client/components/confirmRemoveTimepointAssociation/confirmRemoveTimepointAssociation.js', 'client');

    api.addFiles('client/components/lastLoginModal/lastLoginModal.html', 'client');
    api.addFiles('client/components/lastLoginModal/lastLoginModal.js', 'client');

    // Server functions
    api.addFiles('server/collections.js', 'server');
    api.addFiles('server/removeCollections.js', [ 'server' ]);
    api.addFiles('server/reviewers.js', [ 'server' ]);

    // Both client and server functions
    api.addFiles('both/collections.js', [ 'client', 'server' ]);

    // Worklist-related functions
    api.addFiles('lib/worklist/openNewTabWithTimepoint.js', 'client');
    api.addFiles('lib/worklist/worklistModification.js', 'client');

    // Library functions
    api.addFiles('lib/TrialCriteriaConstraints.js', 'client');
    api.addFiles('lib/TrialResponseCriteria.js', 'client');
    api.addFiles('lib/LesionManager.js', 'client');
    api.addFiles('lib/pixelSpacingAutorunCheck.js', 'client');
    api.addFiles('lib/toggleLesionTrackerTools.js', 'client');
    api.addFiles('lib/clearMeasurementTimepointData.js', 'client');
    api.addFiles('lib/removeToolDataWithMeasurementId.js', 'client');
    api.addFiles('lib/getTimepointObject.js', 'client');
    api.addFiles('lib/getTimepointName.js', 'client');
    api.addFiles('lib/activateMeasurements.js', 'client');
    api.addFiles('lib/activateLesion.js', 'client');
    api.addFiles('lib/deactivateAllToolData.js', 'client');
    api.addFiles('lib/clearTools.js', 'client');
    api.addFiles('lib/calculateTotalLesionBurden.js', 'client');
    api.addFiles('lib/convertToNonTarget.js', 'client');
    api.addFiles('lib/convertNonTarget.js', 'client');
    api.addFiles('lib/timepointAutoCheck.js', 'client');

    api.addFiles('lib/syncMeasurementAndToolData.js', 'client');
    api.addFiles('lib/syncImageMeasurementAndToolData.js', 'client');
    api.addFiles('lib/updateRelatedElements.js', 'client');

    api.addFiles('lib/handleMeasurementAdded.js', 'client');
    api.addFiles('lib/handleMeasurementModified.js', 'client');
    api.addFiles('lib/handleMeasurementRemoved.js', 'client');

    // API classes
    api.addFiles('lib/api/timepoint.js');

    // Export global functions
    api.export('pixelSpacingAutorunCheck', 'client');
    api.export('handleMeasurementAdded', 'client');
    api.export('handleMeasurementModified', 'client');
    api.export('handleMeasurementRemoved', 'client');
    api.export('syncMeasurementAndToolData', 'client');
    api.export('syncImageMeasurementAndToolData', 'client');
    api.export('updateRelatedElements', 'client');
    api.export('openNewTabWithTimepoint', 'client');
    api.export('activateLesion', 'client');
    api.export('activateMeasurements', 'client');
    api.export('deactivateAllToolData', 'client');
    api.export('toggleLesionTrackerTools', 'client');
    api.export('clearMeasurementTimepointData', 'client');
    api.export('removeToolDataWithMeasurementId', 'client');
    api.export('getTimepointObject', 'client');
    api.export('clearTools', 'client');
    api.export('getTimepointName', 'client');
    api.export('getTrialCriteriaConstraints', 'client');
    api.export('calculateTotalLesionBurden', 'client');
    api.export('convertToNonTarget', 'client');
    api.export('convertNonTarget', 'client');
    api.export('timepointAutoCheck', 'client');

    // Export global objects
    api.export('TrialResponseCriteria', 'client');
    api.export('TrialCriteriaConstraints', 'client');
    api.export('LesionManager', 'client');

    // Export client-side collections
    api.export('ValidationErrors', 'client');
    api.export('LesionLocations', 'client');
    api.export('LocationResponses', 'client');
    api.export('TrialCriteriaTypes', 'client');

    // Export collections spanning both client and server
    api.export('AdditionalFindings', [ 'client', 'server' ]);
    api.export('ImageMeasurements', [ 'client', 'server' ]);
    api.export('Measurements', [ 'client', 'server' ]);
    api.export('Studies', [ 'client', 'server' ]);
    api.export('Timepoints', [ 'client', 'server' ]);
    api.export('Reviewers', [ 'client', 'server' ]);
});
