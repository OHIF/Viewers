import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { OHIF } from 'meteor/ohif:core';

Template.studyBrowserSeries.onCreated(() => {
    const instance = Template.instance();
    const { studyInformation } = instance.data;
    const { studyInstanceUid } = studyInformation;

    instance.thumbnails = new ReactiveVar([]);

    // Get the study metadata and update the study thumbnails
    instance.autorun(() => {
        const studyMetadata = OHIF.viewer.Studies.findBy({ studyInstanceUid });

        // Defines the resulting thumbnails list
        const thumbnails = [];
        studyMetadata.displaySets.forEach((stack, thumbnailIndex) => {
            thumbnails.push({
                thumbnailIndex,
                stack
            });
        });

        instance.thumbnails.set(thumbnails);
    });
});

Template.studyBrowserSeries.onRendered(() => {
    const instance = Template.instance();

    // Run this computation every time the thumbnails are changed
    instance.autorun(() => {
        instance.thumbnails.get();
        Tracker.afterFlush(() => {
            instance.$('.study-browser-series').adjustMax('height');
        });
    });
});
