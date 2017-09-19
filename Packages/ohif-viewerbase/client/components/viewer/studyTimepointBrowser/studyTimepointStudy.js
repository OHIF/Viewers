import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

Template.studyTimepointStudy.onCreated(() => {
    const instance = Template.instance();

    instance.loading = new ReactiveVar(false);

    // Get the current study element
    instance.getStudyElement = (isGlobal=false) => {
        const studyInstanceUid = instance.data.study.studyInstanceUid;
        const selector = `.studyTimepointStudy[data-uid='${studyInstanceUid}']`;
        return isGlobal ? $(selector) : instance.$browser.find(selector);
    };

    instance.isQuickSwitch = () => {
        return !_.isUndefined(instance.data.viewportIndex);
    };

    // Set the current study as selected in the studies list
    instance.select = (isQuickSwitch=false) => {
        const studyInstanceUid = instance.data.study.studyInstanceUid;

        const $study = instance.getStudyElement();
        const $timepoint = $study.closest('.studyTimepoint');

        const selectionChanged = {
            selection: [$study[0]],
            studyInstanceUid,
            isQuickSwitch
        };

        $timepoint.trigger('selectionChanged', selectionChanged);
    };

    instance.initializeStudyWrapper = () => {
        // Stop here if it's a quick switch
        if (instance.isQuickSwitch()) {
            return;
        }

        const $study = instance.getStudyElement();
        const $thumbnails = $study.find('.studyTimepointThumbnails');
        $study.addClass('active');
        // If element already has max-height property set, .height()
        // will return that value, so remove it to recalculate
        $thumbnails.css('max-height', '');
        $thumbnails.css('max-height', $thumbnails.height());
        $study.removeClass('active');

        // Here we add, remove, and add the active class again because this way
        // the max-height animation appears smooth to the user.
        if (instance.data.active) {
            Meteor.setTimeout(() => $study.addClass('active'), 1);
        }
    };
});

// Initialize the study wrapper max-height to enable CSS transition
Template.studyTimepointStudy.onRendered(() => {
    const instance = Template.instance();

    // Keep the study timepoint browser element to manipulate elements even after DOM is removed
    instance.$browser = instance.$('.studyTimepointStudy').closest('.studyTimepointBrowser');

    instance.initializeStudyWrapper();
});

Template.studyTimepointStudy.events({
    // Recalculates the timepoint height to make CSS transition smoother
    'transitionend .studyTimepointThumbnails'(event, instance) {
        if (event.target === event.currentTarget) {
            $(event.currentTarget).closest('.studyTimepoint').trigger('displayStateChanged');
        }
    },

    // Transfers the active state to the current study
    'click .studyQuickSwitchTimepoint .studyModality'(event, instance) {
        instance.select(true);
    },

    // Set loading state
    'loadStarted .studyTimepointStudy'(event, instance) {
        instance.loading.set(true);
    },

    // Remove loading state and fix the thumbnails wrappers height
    'loadEnded .studyTimepointStudy'(event, instance) {
        instance.loading.set(false);
        instance.initializeStudyWrapper();
    },

    // Changes the current study selection for the clicked study
    'click .studyModality'(event, instance) {
        const studyData = instance.data.study;
        const { studyInstanceUid } = studyData;
        const isQuickSwitch = instance.isQuickSwitch();

        // @TypeSafeStudies
        // Check if the study already has series data,
        // and if not, retrieve it.
        if (!studyData.seriesList) {
            const alreadyLoaded = OHIF.viewer.Studies.findBy({ studyInstanceUid });

            if (!alreadyLoaded) {
                const $studies = instance.getStudyElement(true);
                $studies.trigger('loadStarted');
                OHIF.studylist.retrieveStudyMetadata(studyInstanceUid).then(study => {
                    instance.data.study = study;
                    OHIF.viewer.Studies.insert(study);

                    Meteor.setTimeout(() => {
                        $studies.trigger('loadEnded');
                        instance.select(isQuickSwitch);
                    }, 1);
                });
            } else {
                studyData.seriesList = alreadyLoaded.seriesList;
                instance.select(isQuickSwitch);
            }
        } else {
            instance.select(isQuickSwitch);
        }
    }
});

Template.studyTimepointStudy.helpers({
    isLoading() {
        // @TypeSafeStudies
        const instance = Template.instance();
        const studyData = instance.data.study;
        const alreadyLoaded = OHIF.viewer.Studies.findBy({ studyInstanceUid: studyData.studyInstanceUid });
        return instance.loading.get() && !alreadyLoaded;
    },

    modalities() {
        const instance = Template.instance();
        let modalities = instance.data.study.modalities;

        // Replace backslashes with spaces
        return modalities.replace(/\\/g, ' ');
    },

    modalityStyle() {
        // Responsively styles the Modality Acronyms for studies
        // with more than one modality
        const instance = Template.instance();
        const modalities = instance.data.study.modalities || 'UN';
        const numModalities = modalities.split(/\\/g).length;

        if (numModalities === 1) {
            // If we have only one modality, it should take up the whole
            // div.
            return 'font-size: 1vw';
        } else if (numModalities === 2) {
            // If we have two, let them sit side-by-side
            return 'font-size: 0.75vw';
        } else {
            // If we have more than two modalities, change the line
            // height to display multiple rows, depending on the number
            // of modalities we need to display.
            const lineHeight = Math.ceil(numModalities / 2) * 1.2;
            return 'line-height: ' + lineHeight + 'vh';
        }
    }
});
