import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { OHIF } from 'meteor/ohif:core';

Template.timepointBrowserQuickSwitch.onCreated(() => {
    const instance = Template.instance();
    instance.showAdditional = new ReactiveVar(false);
    instance.currentTimepoint = new ReactiveVar();

    instance.updateCurrentTimepoint = studyInstanceUid => {
        const currentTimepoint = OHIF.viewer.timepointApi.study(studyInstanceUid)[0];
        instance.currentTimepoint.set(currentTimepoint);
    };

    const { viewportIndex } = instance.data;
    instance.autorun(() => {
        OHIF.viewerbase.layoutManager.observer.depend();
        const viewportData = OHIF.viewerbase.layoutManager.viewportData[viewportIndex];
        instance.updateCurrentTimepoint(viewportData.studyInstanceUid);
    });

    instance.autorun(() => {
        instance.data.currentStudy.dep.depend();
        instance.showAdditional.set(false);
    });
});

Template.timepointBrowserQuickSwitch.onRendered(() => {
    const instance = Template.instance();

    instance.autorun(() => {
        const currentTimepoint = instance.currentTimepoint.get();
        const currentTimepointId = (currentTimepoint && currentTimepoint.timepointId) || '';
        const $allBrowserItems = instance.$('.timepoint-browser-item');
        const $browserItem = $allBrowserItems.filter(`[data-id=${currentTimepointId}]`);
        if (!$browserItem.hasClass('active')) {
            $browserItem.find('.timepoint-item').trigger('click');
        }
    });

    instance.autorun(() => {
        const currentStudy = instance.data.currentStudy.get();
        const studyInstanceUid = (currentStudy && currentStudy.studyInstanceUid) || '';
        Tracker.afterFlush(() => {
            const $studyBrowserItems = instance.$('.study-browser-item');
            $studyBrowserItems.removeClass('active');
            $studyBrowserItems.filter(`[data-uid="${studyInstanceUid}"]`).addClass('active');
        });
    });
});

Template.timepointBrowserQuickSwitch.events({
    'ohif.lesiontracker.timepoint.click'(event, instance) {
        const $element = $(event.currentTarget);

        // Defer the active class toggling to wait for child template rendering
        Meteor.defer(() => $element.toggleClass('active'));
    },

    'ohif.studies.study.click'(event, instance, studyInformation) {
        const { studyInstanceUid } = studyInformation;
        const study = OHIF.viewer.Studies.findBy({ studyInstanceUid });
        instance.data.currentStudy.set(study);
        const $studySwitch = $(event.currentTarget).closest('.study-switch');
        $studySwitch.siblings('.series-switch').trigger('rescale');
        instance.updateCurrentTimepoint(studyInformation.studyInstanceUid);
    },

    'click .show-additional'(event, instance) {
        instance.showAdditional.set(true);
    },
});

Template.timepointBrowserQuickSwitch.helpers({
    timepointBrowserData() {
        const instance = Template.instance();
        const { timepointApi } = OHIF.viewer;
        const currentTimepoint = instance.currentTimepoint.get();
        let timepoints;
        if (instance.showAdditional.get()) {
            timepoints = timepointApi.key();
        } else {
            timepoints = [currentTimepoint];
        }

        return {
            timepointApi,
            timepoints,
            timepointChildTemplate: 'timepointBrowserStudies'
        };
    }
});
