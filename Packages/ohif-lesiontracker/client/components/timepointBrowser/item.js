import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.timepointBrowserItem.onCreated(() => {
    const instance = Template.instance();
    const { timepoint, timepointApi } = instance.data;
    const { timepointId } = timepoint;

    const hasStudiesData = !!(timepoint.studiesData && timepoint.studiesData.length);
    instance.summary = new ReactiveVar('');
    instance.studiesData = new ReactiveVar(hasStudiesData ? timepoint.studiesData : null);

    const updateStudiesData = newDocument => {
        const newTimepoint = newDocument || timepointApi.timepoints.findOne({ timepointId });
        if (newTimepoint && newTimepoint.studiesData && newTimepoint.studiesData.length) {
            instance.studiesData.set(newTimepoint.studiesData);
        }
    };

    timepointApi.timepoints.find({ timepointId }).observe({ changed: updateStudiesData });

    // Build the modalities summary of all timepoint's studies
    instance.setModalitiesSummary = () => {
        const studiesData = instance.studiesData.get();
        if (!studiesData) return;

        const modalities = {};
        studiesData.forEach(study => {
            const modality = study.modalities || 'UN';
            modalities[modality] = modalities[modality] + 1 || 1;
        });

        const summary = [];
        _.each(modalities, (count, modality) => summary.push(`${count} ${modality}`));

        instance.summary.set(summary.join(', '));
    };

    const filter = { studyInstanceUid: timepoint.studyInstanceUids };
    instance.loadStudies = () => OHIF.studies.searchStudies(filter).then(studiesData => {
        instance.studiesData.set(studiesData);
        timepointApi.timepoints.update(timepoint._id, { $set: { studiesData } });
        instance.setModalitiesSummary();
    }).catch(error => {
        const text = 'An error has occurred while retrieving studies information';
        OHIF.ui.notifications.danger({ text });
        OHIF.log.error(error);
        instance.summary.set('Failed');
    });

    updateStudiesData();
    instance.autorun(() => {
        const studiesData = instance.studiesData.get();
        if (studiesData) {
            instance.setModalitiesSummary();
        }
    });
});

Template.timepointBrowserItem.events({
    'ohif.measurements.timepoint.load .timepoint-item'(event, instance) {
        instance.loadStudies();
    },

    'click .timepoint-item'(event, instance) {
        const element = event.currentTarget.parentElement;
        const $element = $(element);

        const triggerClick = () => {
            $element.trigger('ohif.measurements.timepoint.click', instance.data.timepoint);
        };

        if (!instance.studiesData.get()) {
            instance.summary.set('Loading...');
            instance.loadStudies().then(() => Tracker.afterFlush(triggerClick));
        } else {
            triggerClick();
        }
    }
});
