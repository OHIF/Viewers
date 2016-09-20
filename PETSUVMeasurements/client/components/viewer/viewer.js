import { OHIF } from 'meteor/ohif:core';
import { MeasurementsConfiguration } from 'meteor/ohif:measurements/both/configuration/measurements';
import { MeasurementHandlers } from 'meteor/ohif:measurements/client/lib/MeasurementHandlers';

Session.set('MeasurementsReady', false);

Template.viewer.onCreated(() => {
    OHIF.viewer = OHIF.viewer || {};

    const instance = Template.instance();

    instance.data.state = new ReactiveDict();
    instance.data.state.set('leftSidebar', Session.get('leftSidebar'));
    instance.data.state.set('rightSidebar', Session.get('rightSidebar'));

    const contentId = instance.data.contentId;

    if (ViewerData[contentId].loadedSeriesData) {
        OHIF.log.info('Reloading previous loadedSeriesData');
        OHIF.viewer.loadedSeriesData = ViewerData[contentId].loadedSeriesData;

    } else {
        OHIF.log.info('Setting default ViewerData');
        OHIF.viewer.loadedSeriesData = {};
        ViewerData[contentId].loadedSeriesData = {};
        Session.set('ViewerData', ViewerData);
    }

    Session.set('activeViewport', ViewerData[contentId].activeViewport || false);

    // Update the ViewerStudies collection with the loaded studies
    ViewerStudies.remove({});

    instance.data.studies.forEach(study => {
        study.selected = true;
        study.displaySets = createStacks(study);
        ViewerStudies.insert(study);
    });

    instance.data.measurementApi = new OHIF.measurements.MeasurementApi();
    const measurementsPromise = instance.data.measurementApi.retrieveMeasurements();
    measurementsPromise.then(() => {
        Session.set('MeasurementsReady', true);

        instance.data.measurementApi.syncMeasurementsAndToolData();
    })
});

Template.viewer.helpers({
    dataSourcesReady() {
        // TODO: Find a better way to do this
        return Session.get('MeasurementsReady');
    }
})

Template.viewer.events({
    'CornerstoneToolsMeasurementAdded .imageViewerViewport'(event, instance, eventData) {
        MeasurementHandlers.onAdded(event, instance, eventData);
    },
    'CornerstoneToolsMeasurementModified .imageViewerViewport'(event, instance, eventData) {
        MeasurementHandlers.onModified(event, instance, eventData);
    },
    'CornerstoneToolsMeasurementRemoved .imageViewerViewport'(event, instance, eventData) {
        MeasurementHandlers.onRemoved(event, instance, eventData);
    }
});
