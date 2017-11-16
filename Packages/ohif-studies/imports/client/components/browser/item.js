import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.studyBrowserItem.onCreated(() => {
    const instance = Template.instance();
    const { studyInformation } = instance.data;
    const { studyInstanceUid } = studyInformation;

    instance.loaded = new ReactiveVar(false);
    instance.loading = new ReactiveVar(false);

    instance.studyData = new ReactiveVar(studyInformation);

    instance.studyMetadata = null;
    instance.getStudyMetadata = () => {
        instance.loading.dep.depend();

        if (!instance.studyMetadata) {
            let study = OHIF.viewer.Studies.findBy({ studyInstanceUid }) || null;
            if (study && !(study instanceof OHIF.viewerbase.metadata.StudyMetadata)) {
                study = new OHIF.metadata.StudyMetadata(study, study.studyInstanceUid);
            }

            instance.studyMetadata = study;
        }

        return instance.studyMetadata;
    };

    instance.autorun(() => {
        const instance = Template.instance();

        OHIF.studies.loadingDict.get(studyInstanceUid);
        const studyMetadata = instance.getStudyMetadata();
        if (studyMetadata) {
            const firstInstance = studyMetadata.getFirstInstance();
            instance.studyData.set({
                studyDate: firstInstance.getRawValue('x00080020') || '',
                studyDescription: firstInstance.getRawValue('x00081030') || '',
                modalities: firstInstance.getRawValue('x00080060') || '',
            });

            instance.loaded.set(true);
            instance.loading.set(false);
        }
    });
});

Template.studyBrowserItem.events({
    'click .study-item'(event, instance) {
        if (instance.loading.get()) return;

        const { studyInformation } = instance.data;

        //  Skip if study is not available
        if (!studyInformation.available) {
            return;
        }

        const element = event.currentTarget.parentElement;
        const $element = $(element);
        const triggerClick = () => {
            const cloneEvent = _.clone(event);
            delete cloneEvent.type;
            cloneEvent.currentTarget = cloneEvent.target = element;
            const newEvent = $.Event('ohif.studies.study.click', cloneEvent);
            $element.trigger(newEvent, studyInformation);
        };

        if (instance.loaded.get()) {
            triggerClick();
        } else {
            instance.loading.set(true);
            OHIF.studies.loadStudy(studyInformation.studyInstanceUid).then(() => {
                instance.loaded.set(true);
                instance.loading.set(false);
                $element.trigger('ohif.studies.study.load', studyInformation);
                Tracker.afterFlush(triggerClick);
            });
        }
    }
});

Template.studyBrowserItem.helpers({
    isLoaded() {
        return Template.instance().loaded.get();
    },

    isLoading() {
        return Template.instance().loading.get();
    },

    modalitiesText(modalities) {
        const text = modalities || 'UN';
        return _.uniq(text.split(/[^A-Za-z]+/g)).join(' ');
    },

    modalityStyle(modalities) {
        // Responsively styles the Modality Acronyms for studies with more than one modality
        const numModalities = modalities.split(/\s/g).length;

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
