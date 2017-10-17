import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.timepointBrowserItem.onCreated(() => {
    const instance = Template.instance();
    const { timepoint, timepointApi } = instance.data;

    instance.summary = new ReactiveVar('');
    instance.loading = new ReactiveVar(false);
    instance.loaded = !!(timepoint.studiesData && timepoint.studiesData.length);

    // Build the modalities summary of all timepoint's studies
    instance.setModalitiesSummary = () => {
        const modalities = {};
        timepoint.studiesData.forEach(study => {
            const modality = study.modalities || 'UN';
            modalities[modality] = modalities[modality] + 1 || 1;
        });

        const summary = [];
        _.each(modalities, (count, modality) => summary.push(`${count} ${modality}`));

        instance.summary.set(summary.join(', '));
    };

    const filter = { studyInstanceUid: timepoint.studyInstanceUids };
    instance.loadStudies = () => OHIF.studies.searchStudies(filter).then(studiesData => {
        timepoint.studiesData = studiesData;
        timepointApi.timepoints.update(timepoint._id, { $set: { studiesData } });
        instance.loaded = true;
        instance.loading.set(false);
    }).catch(error => {
        const text = 'An error has occurred while retrieving studies information';
        OHIF.ui.notifications.danger({ text });
        OHIF.log.error(error);
    });

    if (instance.loaded) {
        instance.setModalitiesSummary();
    }
});

Template.timepointBrowserItem.events({
    'click .timepoint-item'(event, instance) {
        const element = event.currentTarget.parentElement;
        const $element = $(element);

        const triggerClick = () => {
            $element.trigger('ohif.lesiontracker.timepoint.click', instance.data.timepoint);
        };

        if (!instance.loaded) {
            instance.summary.set('Loading...');
            instance.loadStudies().then(() => {
                Tracker.afterFlush(triggerClick);
                instance.setModalitiesSummary();
            });
        } else {
            triggerClick();
        }
    }
});
