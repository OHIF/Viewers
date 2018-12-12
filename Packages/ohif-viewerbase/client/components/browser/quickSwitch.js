import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { OHIF } from 'meteor/ohif:core';

Template.studyBrowserQuickSwitch.onCreated(() => {
    const instance = Template.instance();
    instance.studiesInformation = new ReactiveVar();
    const filter = { studyInstanceUid: OHIF.viewer.data.studyInstanceUids };
    OHIF.studies.searchStudies(filter).then(studies => instance.studiesInformation.set(studies));
});

Template.studyBrowserQuickSwitch.onRendered(() => {
    const instance = Template.instance();
    instance.autorun(() => {
        instance.studiesInformation.dep.depend();
        const currentStudy = instance.data.currentStudy.get();
        const studyInstanceUid = (currentStudy && currentStudy.studyInstanceUid) || '';
        Tracker.afterFlush(() => {
            const $studyBrowserItems = instance.$('.study-browser-item');
            $studyBrowserItems.removeClass('active');
            $studyBrowserItems.filter(`[data-uid="${studyInstanceUid}"]`).addClass('active');
        });
    });
});

Template.studyBrowserQuickSwitch.events({
    'ohif.studies.study.click'(event, instance, studyInformation) {
        const { studyInstanceUid } = studyInformation;
        const study = OHIF.viewer.Studies.findBy({ studyInstanceUid });
        instance.data.currentStudy.set(study);
        const $studySwitch = $(event.currentTarget).closest('.study-switch');
        $studySwitch.siblings('.series-switch').trigger('rescale');
    }
});

Template.studyBrowserQuickSwitch.helpers({
    studyBrowserData() {
        const instance = Template.instance();
        const studiesInformation = instance.studiesInformation.get();
        return { studiesInformation };
    }
});
