Package.describe({
    name: 'ohif:lesiontracker',
    summary: 'OHIF Lesion Tracker Tools',
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

    // Control over logging
    api.use('practicalmeteor:loglevel');

    // Template overriding
    api.use('aldeed:template-extension@4.0.0');

    // Our custom packages
    api.use('design');
    api.use('ohif:core');
    api.use('ohif:study-list');
    api.use('ohif:cornerstone');
    api.use('ohif:measurements');

    api.addFiles('log.js', [ 'client', 'server' ]);

    api.addFiles('both/configuration/bidirectional.js', [ 'client', 'server' ]);
    api.addFiles('both/configuration/nonTarget.js', [ 'client', 'server' ]);
    api.addFiles('both/configuration/ellipse.js', [ 'client', 'server' ]);
    api.addFiles('both/configuration/length.js', [ 'client', 'server' ]);
    api.addFiles('both/configuration/measurementTools.js', [ 'client', 'server' ]);
    
    api.addFiles('both/configuration/dataExchange.js', [ 'client', 'server' ]);
    api.addFiles('both/configuration/dataValidation.js', [ 'client', 'server' ]);
    api.addFiles('both/configuration/configuration.js', [ 'client', 'server' ]);


    api.addFiles('server/methods.js', 'server');


    // Client-side collections
    api.addFiles('client/collections/LesionLocations.js', 'client');
    api.addFiles('client/collections/LocationResponses.js', 'client');

    // Additional Custom Cornerstone Tools for Lesion Tracker
    api.addFiles([
        'client/compatibility/bidirectionalTool.js',
        'client/compatibility/nonTargetTool.js',
        'client/compatibility/scaleOverlayTool.js',
        'client/compatibility/deleteLesionKeyboardTool.js',
        'client/compatibility/qualitativeTargetTools.js'
    ], 'client', {
        bare: true
    });

    api.addFiles('client/tools.js', 'client');

    // UI Components
    api.addFiles('client/components/optionsModal/optionsModal.html', 'client');
    api.addFiles('client/components/optionsModal/optionsModal.styl', 'client');
    api.addFiles('client/components/optionsModal/optionsModal.js', 'client');

    api.addFiles('client/components/optionsModal/recistDescription/recistDescription.html', 'client');
    api.addFiles('client/components/optionsModal/irRCDescription/irRCDescription.html', 'client');

    api.addFiles('client/components/measurementLocationDialog/measurementLocationDialog.html', 'client');
    api.addFiles('client/components/measurementLocationDialog/measurementLocationDialog.js', 'client');
    api.addFiles('client/components/measurementLocationDialog/measurementLocationDialog.styl', 'client');
    
    api.addFiles('client/components/nonTargetLesionDialog/nonTargetLesionDialog.html', 'client');
    api.addFiles('client/components/nonTargetLesionDialog/nonTargetLesionDialog.styl', 'client');
    api.addFiles('client/components/nonTargetLesionDialog/nonTargetLesionDialog.js', 'client');

    api.addFiles('client/components/nonTargetResponseDialog/nonTargetResponseDialog.html', 'client');
    api.addFiles('client/components/nonTargetResponseDialog/nonTargetResponseDialog.styl', 'client');
    api.addFiles('client/components/nonTargetResponseDialog/nonTargetResponseDialog.js', 'client');

    api.addFiles('client/components/measureFlow/measureFlow.html', 'client');
    api.addFiles('client/components/measureFlow/measureFlow.styl', 'client');
    api.addFiles('client/components/measureFlow/measureFlow.js', 'client');

    // StudyList-related functions
    api.addFiles('lib/studylist/openNewTabWithTimepoint.js', 'client');
    api.addFiles('lib/studylist/studylistModification.js', 'client');

    // Library functions
    api.addFiles('lib/TrialCriteriaConstraints.js', 'client');
    api.addFiles('lib/MeasurementValidation.js', 'client');
    
    api.addFiles('lib/pixelSpacingAutorunCheck.js', 'client');
    api.addFiles('lib/toggleLesionTrackerTools.js', 'client');
    api.addFiles('lib/clearMeasurementTimepointData.js', 'client');
    api.addFiles('lib/convertToNonTarget.js', 'client');
    api.addFiles('lib/convertNonTarget.js', 'client');

    api.addFiles('lib/syncMeasurementAndToolData.js', 'client');

    // Export global functions
    api.export('pixelSpacingAutorunCheck', 'client');
    api.export('syncMeasurementAndToolData', 'client');
    api.export('syncImageMeasurementAndToolData', 'client');
    api.export('openNewTabWithTimepoint', 'client');
    api.export('activateLesion', 'client');
    api.export('activateMeasurements', 'client');
    api.export('deactivateAllToolData', 'client');
    api.export('toggleLesionTrackerTools', 'client');
    api.export('clearMeasurementTimepointData', 'client');
    api.export('getTrialCriteriaConstraints', 'client');
    api.export('convertToNonTarget', 'client');
    api.export('convertNonTarget', 'client');

    // Export global objects
    api.export('MeasurementValidation', 'client');
    api.export('TrialCriteriaConstraints', 'client');

    // Export client-side collections
    api.export('ValidationErrors', 'client');
    api.export('LesionLocations', 'client');
    api.export('LocationResponses', 'client');
    api.export('TrialCriteriaTypes', 'client');

    // Export collections spanning both client and server
    api.export('AdditionalFindings', [ 'client', 'server' ]);

    // Export utility classes
    api.export('FormUtils', 'client');

    api.export('Configuration', ['client', 'server']);
});
