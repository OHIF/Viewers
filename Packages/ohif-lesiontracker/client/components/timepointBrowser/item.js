import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';

Template.timepointBrowserItem.onCreated(() => {
    const instance = Template.instance();
    const { timepoint, timepointApi } = instance.data;

    instance.loading = new ReactiveVar(false);
    instance.loaded = !!(timepoint.studiesData && timepoint.studiesData.length);

    instance.autorun(() => {
        if (instance.loaded || !instance.loading.get()) return;

        const filter = { studyInstanceUid: timepoint.studyInstanceUids };
        Meteor.call('StudyListSearch', filter, (error, studiesData) => {
            if (error) {
                const text = 'An error has occurred while retrieving studies information';
                OHIF.ui.notifications.danger({ text });
                OHIF.log.error(error);
            } else {
                timepoint.studiesData = studiesData;
                timepointApi.timepoints.update(timepoint._id, { $set: studiesData });
            }
        });
    });
});
