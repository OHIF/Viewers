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
    instance.missingStudyUids = new ReactiveVar(null);

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

            //  Determine missing timepoint studies
            const missingStudyUids = [];
            timepoint.studyInstanceUids.forEach((timepointStudyUid) => {
                if (!studiesData.find(studyData => studyData.available && studyData.studyInstanceUid === timepointStudyUid)) {
                    missingStudyUids.push(timepointStudyUid);
                }
            });
            instance.missingStudyUids.set(missingStudyUids);
        }
    });
});

Template.timepointBrowserItem.helpers({
    studyAvailability: () => {
        const instance = Template.instance();
        const { timepoint } = instance.data;
        const missingStudyUids = instance.missingStudyUids && instance.missingStudyUids.get();

        if (!missingStudyUids || !timepoint) {
            //  Timepoint studies are not loaded/checked yet (may be indicated as disabled circle)
            return "studies-not-ready";
        }

        if (missingStudyUids.length >= timepoint.studyInstanceUids.length) {
            //  All timepoint studies are not available (may be indicated as empty circle)
            return "studies-not-available";
        }

        if (missingStudyUids.length > 0) {
            //  Timepoint studies are partially available (may be indicated as half-filled circle)
            return "studies-partially-available";
        }

        //  All timepoint studies are available (may be indicated as filled circle)
        return "studies-fully-available";
    }
});

Template.timepointBrowserItem.events({
    'ohif.lesiontracker.timepoint.load .timepoint-item'(event, instance) {
        instance.loadStudies();
    },

    'click .timepoint-item'(event, instance) {
        const element = event.currentTarget.parentElement;
        const $element = $(element);

        const triggerClick = () => {
            $element.trigger('ohif.lesiontracker.timepoint.click', instance.data.timepoint);
        };

        if (!instance.studiesData.get()) {
            instance.summary.set('Loading...');
            instance.loadStudies().then(() => Tracker.afterFlush(triggerClick));
        } else {
            triggerClick();
        }
    }
});
