import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';

Template.measurementLightTableView.onCreated(() => {
    const instance = Template.instance();
    const { measurementApi, timepointApi } = instance.data;

    instance.data.measurementGroups = new ReactiveVar();

    instance.path = 'viewer.studyViewer.measurements';
    instance.saveObserver = new Tracker.Dependency();

    instance.api = {
        save() {
            
            const successHandler = () => {
                OHIF.ui.unsavedChanges.clear(`${instance.path}.*`);
                instance.saveObserver.changed();
            };
    
            // Display the error messages
            const errorHandler = data => {
                OHIF.ui.showDialog('dialogInfo', Object.assign({ class: 'themed' }, data));
            };
    
            const promise = instance.data.measurementApi.storeMeasurements();
            promise.then(successHandler).catch(errorHandler);
            OHIF.ui.showDialog('dialogLoading', {
                promise,
                text: 'Measurements saved.'
            });
    
            return promise;
        },
        exportCSV() {
            const { measurementApi, timepointApi } = instance.data;
            OHIF.measurements.exportCSV(measurementApi, timepointApi);
        }
    };

    instance.autorun(() => {
        measurementApi.changeObserver.depend();
        const data = OHIF.measurements.getMeasurementsGroupedByNumber(measurementApi, timepointApi);
        instance.data.measurementGroups.set(data);
    });
});

Template.measurementLightTableView.helpers({
    hasUnsavedChanges() {
        const instance = Template.instance();
        // Run this computation on save or every time any measurement / timepoint suffer changes
        OHIF.ui.unsavedChanges.depend();
        instance.saveObserver.depend();
    
        return OHIF.ui.unsavedChanges.probe('viewer.*') !== 0;
    },

    hasAnyMeasurement() {
        const instance = Template.instance();
        const groups = instance.data.measurementGroups.get();

        if (!groups) {
            return false;
        }

        const group = groups.find(item => item.measurementRows.length > 0);
        return group;
    },

    saveEnabled() {
        const server = OHIF.servers.getCurrentServer();
        return (server && server.type === 'dicomWeb');
    }
});
