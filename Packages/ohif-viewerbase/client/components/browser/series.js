import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { OHIF } from 'meteor/ohif:core';

Template.studyBrowserSeries.onCreated(() => {
    const instance = Template.instance();
    const { studyInformation, studyMetadata } = instance.data;
    const studyInstanceUid = (studyMetadata && studyMetadata.studyInstanceUid) || (studyInformation && studyInformation.studyInstanceUid);

    instance.thumbnails = new ReactiveVar([]);

    // Get the study metadata and update the study thumbnails
    instance.autorun(() => {
        let metadata = studyMetadata;

        // Check for reactivity
        if (metadata instanceof ReactiveVar) {
            metadata = metadata.get();
        }

        // Retrieve the study metadata
        if (!metadata) {
            metadata = OHIF.viewer.Studies.findBy({ studyInstanceUid });
        }

        // Stop here if there's no study metadata
        if (!metadata) return;

        // Get the study display sets
        let displaySets = metadata.displaySets;
        if (!displaySets.length) {
            displaySets = OHIF.viewerbase.sortingManager.getDisplaySets(metadata);
            metadata.displaySets = displaySets;
            metadata.setDisplaySets(displaySets);

            metadata.forEachDisplaySet(displaySet => {
                OHIF.viewerbase.stackManager.makeAndAddStack(metadata, displaySet);
            });
        }

        // Defines the resulting thumbnails list
        const thumbnails = [];
        displaySets.forEach((stack, thumbnailIndex) => {
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
