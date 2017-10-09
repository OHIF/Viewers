import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

Template.studyBrowserItem.onCreated(() => {
    const instance = Template.instance();

    const modality = instance.data.studyInformation.modality || 'UN';
    instance.modalities = modality.replace(/\\/g, ' ');
});

Template.studyBrowserItem.events({
    'click .study-browser-item'(event, instance) {
        const element = event.currentTarget;
        const $element = $(element);
        $element.trigger('ohif.studies.study.click', instance.data.studyInformation);
        const { settings, studyInformation } = instance.data;
        if (settings && typeof settings.studyClickCallback) {
            settings.studyClickCallback(studyInformation, element);
        }
    }
});

Template.studyBrowserItem.helpers({
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
