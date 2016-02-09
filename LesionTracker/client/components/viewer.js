Session.setDefault('activeViewport', false);

ViewerStudies = new Meteor.Collection(null);
ViewerStudies._debugName = 'ViewerStudies';

Template.viewer.onCreated(function() {
    // Attach the Window resize listener
    $(window).on('resize', handleResize);

    ValidationErrors.remove({});

    var self = this;
    var firstMeasurementsActivated = false;
    var contentId = this.data.contentId;

    OHIF = OHIF || {
            viewer: {}
        };

    OHIF.viewer.loadIndicatorDelay = 3000;
    OHIF.viewer.defaultTool = 'wwwc';
    OHIF.viewer.refLinesEnabled = true;
    OHIF.viewer.isPlaying = {};

    OHIF.viewer.functionList = {
        invert: function(element) {
            var viewport = cornerstone.getViewport(element);
            viewport.invert = !viewport.invert;
            cornerstone.setViewport(element, viewport);
        },
        resetViewport: function(element) {
            cornerstone.reset(element);
        },
        playClip: function(element) {
            var viewportIndex = $('.imageViewerViewport').index(element);
            var isPlaying = OHIF.viewer.isPlaying[viewportIndex] || false;
            if (isPlaying === true) {
                cornerstoneTools.stopClip(element);
            } else {
                cornerstoneTools.playClip(element);
            }

            OHIF.viewer.isPlaying[viewportIndex] = !OHIF.viewer.isPlaying[viewportIndex];
            Session.set('UpdateCINE', Random.id());
        },
        toggleLesionTrackerTools: toggleLesionTrackerTools,
        clearTools: clearTools,
        lesion: function() {
            // Used for hotkeys
            toolManager.setActiveTool('lesion');
        },
        nonTarget: function() {
            // Used for hotkeys
            toolManager.setActiveTool('nonTarget');
        }
    };

    // The hotkey can also be an array (e.g. ["NUMPAD0", "0"])
    OHIF.viewer.defaultHotkeys = OHIF.viewer.defaultHotkeys || {};
    OHIF.viewer.defaultHotkeys.toggleLesionTrackerTools = 'O';
    OHIF.viewer.defaultHotkeys.lesion = 'T'; // Target
    OHIF.viewer.defaultHotkeys.nonTarget = 'N'; // Non-target

    if (isTouchDevice()) {
        OHIF.viewer.tooltipConfig = {
            trigger: 'manual'
        };
    } else {
        OHIF.viewer.tooltipConfig = {
            trigger: 'hover'
        };
    }

    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer('CornerstoneNewImage', cornerstoneTools.updateImageSynchronizer);

    log.info('viewer onCreated');

    if (ViewerData[contentId].loadedSeriesData) {
        log.info('Reloading previous loadedSeriesData');
        OHIF.viewer.loadedSeriesData = ViewerData[contentId].loadedSeriesData;

    } else {
        log.info('Setting default ViewerData');
        OHIF.viewer.loadedSeriesData = {};

        ViewerData[contentId].loadedSeriesData = OHIF.viewer.loadedSeriesData;

        // Update the viewer data object
        if (!this.data.timepointIds || this.data.timepointIds.length <= 1) {
            // Update the viewer data object
            ViewerData[contentId].viewportColumns = 1;
            ViewerData[contentId].viewportRows = 1;
        } else if (this.data.timepointIds.length > 1) {
            ViewerData[contentId].viewportColumns = 2;
            ViewerData[contentId].viewportRows = 1;
        }

        ViewerData[contentId].activeViewport = 0;
        Session.set('ViewerData', ViewerData);
    }

    Session.set('activeViewport', ViewerData[contentId].activeViewport || false);

    // Set lesion tool buttons as disabled if pixel spacing is not available for active element
    self.autorun(pixelSpacingAutorunCheck);

    // Update the ViewerStudies collection with the loaded studies
    ViewerStudies.remove({});

    this.data.studies.forEach(function(study) {
        study.selected = true;
        ViewerStudies.insert(study);
    });

    var patientId = this.data.studies[0].patientId;
    Session.set('patientId', patientId);

    self.autorun(function() {
        var dataContext = Template.currentData();
        self.subscribe('singlePatientAssociatedStudies', dataContext.studies[0].patientId);
        self.subscribe('singlePatientTimepoints', dataContext.studies[0].patientId);
        self.subscribe('singlePatientMeasurements', dataContext.studies[0].patientId);

        var subscriptionsReady = self.subscriptionsReady();
        console.log('autorun viewer.js. Ready: ' + subscriptionsReady);

        if (subscriptionsReady) {
            TrialResponseCriteria.validateAllDelayed();

            ViewerStudies.find().observe({
                added: function(study) {
                    // Find the relevant timepoint given the newly added study
                    var timepoint = Timepoints.findOne({
                        studyInstanceUids: {
                            $in: [study.studyInstanceUid]
                        }
                    });

                    if (!timepoint) {
                        log.warn('Study added to Viewer has not been associated!');
                        return;
                    }

                    // Update the added document with its related timepointId
                    ViewerStudies.update(study._id, {
                        $set: {
                            timepointId: timepoint.timepointId
                        }
                    });
                }
            });

            // This is used to re-add tools from the database into the
            // Cornerstone ToolData structure
            Measurements.find().observe({
                added: function(data) {
                    if (data.toolDataInsertedManually === true) {
                        return;
                    }

                    // Activate first measurements in image box as default if exists
                    if (!firstMeasurementsActivated) {
                        var templateData = {
                            contentId: Session.get('activeContentId')
                        };

                        // Activate measurement
                        activateLesion(data._id, templateData);
                        firstMeasurementsActivated = true;
                    }

                    log.info('Measurement added');
                    syncMeasurementAndToolData(data);
                    updateRelatedElements(data.imageId);

                    TrialResponseCriteria.validateAll();
                },
                changed: function(data) {
                    TrialResponseCriteria.validateAllDelayed();
                },
                removed: function(data) {
                    log.info('Measurement removed');

                    // Check that this Measurement actually contains timepoint data
                    if (!data || !data.timepoints) {
                        return;
                    }

                    // Get the Measurement ID and relevant tool so we can remove
                    // tool data for this Measurement
                    var measurementId = data._id;
                    var toolType = data.isTarget ? 'lesion' : 'nonTarget';

                    // Remove the measurement from all the imageIds on which it exists
                    // as toolData
                    Object.keys(data.timepoints).forEach(function(timepointId) {
                        // Clear the toolData for this timepoint
                        var imageId = data.timepoints[timepointId].imageId;
                        removeToolDataWithMeasurementId(imageId, toolType, measurementId);
                    });

                    // Sync database data with toolData for all the measurements
                    // that have just been updated

                    // Note that here we need to use greater than and equals to
                    // find the Measurements, whereas on the server it's
                    // only "greater than", since inside this callback the
                    // Measurements have already been decremented.
                    Measurements.find({
                        patientId: data.patientId,
                        lesionNumberAbsolute: {
                            $gte: data.lesionNumberAbsolute
                        }
                    }).forEach(function(measurementData) {
                        syncMeasurementAndToolData(measurementData);
                    });

                    // Update each displayed viewport
                    var viewports = $('.imageViewerViewport').not('.empty');
                    viewports.each(function(index, element) {
                        cornerstone.updateImage(element);
                    });

                    ValidationErrors.remove({
                        measurementId: data._id
                    });

                    TrialResponseCriteria.validateAll();
                }
            });
        }
    });
});

Template.viewer.onRendered(function() {
    // Enable hotkeys
    enableHotkeys();
});

Template.viewer.onDestroyed(function() {
    log.info('onDestroyed');
    console.log('viewer destroyed!');

    // Remove the Window resize listener
    $(window).off('resize', handleResize);

    OHIF.viewer.updateImageSynchronizer.destroy();
});

Template.viewer.events({
    'CornerstoneToolsMeasurementAdded .imageViewerViewport': function(e, template, eventData) {
        handleMeasurementAdded(e, eventData);
    },
    'CornerstoneToolsMeasurementModified .imageViewerViewport': function(e, template, eventData) {
        handleMeasurementModified(e, eventData);
    },
    'CornerstoneToolsMeasurementRemoved .imageViewerViewport': function(e, template, eventData) {
        handleMeasurementRemoved(e, eventData);
    }
});
