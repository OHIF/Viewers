import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.studyBrowserItem.onCreated(() => {
    const instance = Template.instance();

    instance.loaded = false;
    instance.loading = new ReactiveVar(false);

    const modalities = instance.data.studyInformation.modalities || 'UN';
    instance.modalities = _.uniq(modalities.split(/[^A-Za-z]+/g)).join(' ');
});

Template.studyBrowserItem.events({
    'click .study-item'(event, instance) {
        if (instance.loading.get()) return;

        const { studyInformation } = instance.data;
        const element = event.currentTarget.parentElement;
        const $element = $(element);
        const triggerClick = () => {
            const cloneEvent = _.clone(event);
            delete cloneEvent.type;
            cloneEvent.currentTarget = cloneEvent.target = element;
            const newEvent = $.Event('ohif.studies.study.click', cloneEvent);
            $element.trigger(newEvent, studyInformation);
        };

        if (instance.loaded) {
            triggerClick();
        } else {
            instance.loading.set(true);
            OHIF.studies.loadStudy(studyInformation.studyInstanceUid).then(() => {
                instance.loaded = true;
                instance.loading.set(false);
                $element.trigger('ohif.studies.study.load', studyInformation);
                Tracker.afterFlush(triggerClick);
            });
        }
    }
});

Template.studyBrowserItem.helpers({
    isLoading() {
        return Template.instance().loading.get();
    },

    modalityStyle() {
        // Responsively styles the Modality Acronyms for studies with more than one modality
        const instance = Template.instance();
        const numModalities = instance.modalities.split(/\s/g).length;

        if (numModalities === 1) {
            // If we have only one modality, it should take up the whole div
            return 'font-size:1em';
        } else if (numModalities === 2) {
            // If we have two modalities, let them sit side-by-side
            return 'font-size:0.7em';
        } else {
            // If we have more than two modalities, change the line height to display multiple rows
            return 'font-size:0.7em;line-height:1.4em;padding-top:0.5em';
        }
    }
});
