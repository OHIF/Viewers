import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { OHIFError } from '../../../lib/classes/OHIFError';

Template.studyTimepointBrowser.onCreated(() => {
    const instance = Template.instance();

    // Reactive variable to control the view type for all or key timepoints
    instance.timepointViewType = new ReactiveVar(instance.data.timepointViewType);

    // Defines whether to show all key timepoints or only the current one
    instance.showAdditionalTimepoints = new ReactiveVar(true);

    // Return the current study if it's defined
    instance.getCurrentStudy = () => {
        return instance.data.currentStudy && instance.data.currentStudy.get();
    };

    // Get the studies for a specific timepoint
    instance.getStudies = timepoint => {
        // @TypeSafeStudies

        if (!timepoint) {
            return OHIF.viewer.Studies.all();
        }

        return timepoint.studyInstanceUids.map(studyInstanceUid => {
            const query = {
                patientId: timepoint.patientId,
                studyInstanceUid: studyInstanceUid
            };

            const loadedStudy = OHIF.viewer.Studies.findBy(query);
            if (loadedStudy) {
                return loadedStudy;
            }

            const notYetLoaded = OHIF.studylist.collections.Studies.findOne(query);
            if (!notYetLoaded) {
                throw new OHIFError(`No study data available for Study: ${studyInstanceUid}`);
            }

            return notYetLoaded;
        });
    };
});

Template.studyTimepointBrowser.onRendered(() => {
    const instance = Template.instance();

    // Collapse all timepoints but first when timepoint view type changes
    instance.autorun(() => {
        // Runs this computation every time the timepointViewType is changed
        const type = instance.timepointViewType.get();

        // Removes all active classes to collapse the timepoints and studies
        instance.$('.timepointEntry, .studyTimepointStudy').removeClass('active');
        if (type === 'key' && !instance.data.currentStudy) {
            // Show only first timepoint expanded for key timepoints
            instance.$('.timepointEntry:first').addClass('active');
        }
    });

    // Expand only the timepoints with loaded studies in viewports
    let lastStudy;
    let activeStudiesUids = [];

    // Wait for rerendering and set the timepoint as active
    instance.refreshActiveStudies = () => Tracker.afterFlush(() => {
        _.each(activeStudiesUids, studyInstanceUid => {
            instance.$(`.studyTimepointStudy[data-uid='${studyInstanceUid}']`).addClass('active');
        });
        // Show only first timepoint expanded for key timepoints
        instance.$('.timepointEntry:first').addClass('active');
    });

    instance.autorun(() => {
        // Runs this computation every time the curenty study is changed
        const currentStudy = instance.data.currentStudy && instance.data.currentStudy.get();

        // Stop here if there's no current study set
        if (!currentStudy) {
            return;
        }

        // Check if the study really changed and update the last study
        if (currentStudy !== lastStudy) {
            instance.showAdditionalTimepoints.set(false);
            lastStudy = currentStudy;
            activeStudiesUids = [currentStudy.studyInstanceUid];
        }

        instance.refreshActiveStudies();
    });
});

Template.studyTimepointBrowser.events({
    'click .timepointHeader'(event, instance) {
        const $timepoint = $(event.currentTarget).closest('.timepointEntry');

        // Recalculates the timepoint height to make CSS transition smoother
        $timepoint.find('.studyTimepoint').trigger('displayStateChanged');

        // Toggle active class to group/ungroup timepoint studies
        $timepoint.toggleClass('active');
    },

    'click .studyModality.additional'(event, instance) {
        // Show all key timepoints
        instance.showAdditionalTimepoints.set(true);
    }
});

Template.studyTimepointBrowser.helpers({
    // Decides if the timepoint view type switch shall be shown or omitted
    shallShowViewType(timepointList) {
        const instance = Template.instance();
        return timepointList.length && !instance.data.timepointViewType;
    },

    // Returns the button group data for switching between timepoint view types
    viewTypeButtonGroupData() {
        return {
            value: Template.instance().timepointViewType,
            options: [{
                value: 'key',
                text: 'Key Timepoints'
            }, {
                value: 'all',
                text: 'All Timepoints'
            }]
        };
    },

    // Defines whether to show all key timepoints or only the current one
    showAdditionalTimepoints() {
        return Template.instance().showAdditionalTimepoints.get();
    },

    // Get the timepoints to be listed
    timepoints() {
        const instance = Template.instance();
        // Get the current study
        const currentStudy = instance.getCurrentStudy();
        // Declare the timepoints
        const { timepointApi } = instance.data;
        let timepoints;
        if (currentStudy && !instance.showAdditionalTimepoints.get()) {
            // Show only the current study's timepoint
            timepoints = timepointApi.study(currentStudy.studyInstanceUid);
        } else {
            if (!timepointApi) {
                // If there is no timepoint API defined whatsoever, this means that there is no
                // current timepoint ID, so we can just display all of the currently loaded studies
                // in the study sidebar
                timepoints = [];
            } else if (instance.timepointViewType.get() === 'all') {
                // Show all timepoints
                timepoints = timepointApi.all();
            } else {
                // Show only key timepoints
                timepoints = timepointApi.key();
            }
        }
        // Returns the timepoints
        return timepoints;
    },

    // Get the studies for a specific timepoint
    studies(timepoint) {
        return Template.instance().getStudies(timepoint);
    },

    // Build the modalities summary for all timepoint's studies
    modalitiesSummary(timepoint) {
        const instance = Template.instance();

        const studies = instance.getStudies(timepoint);

        const modalities = {};
        studies.forEach(study => {
            const modality = study.modalities || 'UN';
            modalities[modality] = modalities[modality] + 1 || 1;
        });

        const result = [];
        _.each(modalities, (count, modality) => {
            result.push(`${count} ${modality}`);
        });

        return result.join(', ');
    }
});
