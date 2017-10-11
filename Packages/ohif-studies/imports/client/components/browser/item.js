import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

Template.studyBrowserItem.onCreated(() => {
    const instance = Template.instance();

    instance.loaded = false;
    instance.loading = new ReactiveVar(false);

    const modality = instance.data.studyInformation.modality || 'UN';
    instance.modalities = modality.replace(/\\/g, ' ');
});

Template.studyBrowserItem.events({
    'click .study-item'(event, instance) {
        if (instance.loading.get()) return;

        const { studyClickCallback, studyInformation } = instance.data;
        const element = event.currentTarget.parentElement;
        const $element = $(element);
        $element.trigger('ohif.studies.study.click', studyInformation);

        const triggerClickCallback = () => {
            if (typeof studyClickCallback === 'function') {
                studyClickCallback(studyInformation, element);
            }
        };

        if (instance.loaded) {
            triggerClickCallback();
        } else {
            instance.loading.set(true);
            OHIF.studies.retrieveStudyMetadata(studyInformation.studyInstanceUid).then(() => {
                instance.loaded = true;
                instance.loading.set(false);
                $element.trigger('ohif.studies.study.load', studyInformation);
                triggerClickCallback();
            });
        }
    }
});

Template.studyBrowserItem.helpers({
    isLoading() {
        return Template.instance().loading.get();
    },

    modalityStyle() {
        // Responsively styles the Modality Acronyms for studies
        // with more than one modality
        const instance = Template.instance();
        const numModalities = instance.modalities.split(/\s/g).length;

        if (numModalities === 1) {
            // If we have only one modality, it should take up the whole div.
            return 'font-size: 1em';
        } else if (numModalities === 2) {
            // If we have two, let them sit side-by-side
            return 'font-size: 0.75em';
        } else {
            // If we have more than two modalities, change the line height to display multiple rows,
            // depending on the number of modalities we need to display.
            const lineHeight = Math.ceil(numModalities / 2) * 1.2;
            return 'line-height: ' + lineHeight + 'em';
        }
    }
});
