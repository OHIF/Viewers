import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';

// Use Aldeed's meteor-template-extension package to replace the
// default viewportOverlay template.
// See https://github.com/aldeed/meteor-template-extension
const defaultTemplate = 'viewportOverlay';
Template.longitudinalViewportOverlay.replaces(defaultTemplate);

Template[defaultTemplate].onCreated(() => {
    const instance = Template.instance();
    instance.instanceMetadata = new ReactiveVar();

    const { DICOMTagDescriptions } = OHIF.viewerbase;
    instance.getValueByTagKeyword = tagKeyword => {
        const instanceMetadata = instance.instanceMetadata.get();
        const tagObject = DICOMTagDescriptions.find(tagKeyword);
        if (!instanceMetadata || !tagObject) return;
        return instanceMetadata.getRawValue(tagObject.tag);
    };

    // Run this computation every time the image is changed
    Tracker.autorun(() => {
        Session.get('CornerstoneNewImage' + instance.data.viewportIndex);
        const { studyInstanceUid, seriesInstanceUid, currentImageIdIndex } = instance.data;
        OHIF.studies.loadStudy(studyInstanceUid).then(studyMetadata => {
            const seriesMetadata = studyMetadata.getSeriesByUID(seriesInstanceUid);
            const instanceMetadata = seriesMetadata.getInstanceByIndex(currentImageIdIndex);
            instance.instanceMetadata.set(instanceMetadata);
        });
    });
});

// Add the TimepointName helper to the default template. The
// HTML of this template is replaced with that of longitudinalViewportOverlay
Template[defaultTemplate].helpers({
    studyInfo(tagKeyword) {
        const instance = Template.instance();
        instance.instanceMetadata.dep.depend();
        return instance.getValueByTagKeyword(tagKeyword);
    },

    getGenderAndAge() {
        const instance = Template.instance();
        const values = [];
        values.push(instance.getValueByTagKeyword('PatientSex'));
        values.push(instance.getValueByTagKeyword('PatientAge'));
        return values.filter(value => !!value).join(', ');
    },

    timepointName() {
        const instance = Template.instance();
        const studyInstanceUid = instance.data.studyInstanceUid;

        const timepointApi = OHIF.viewer.timepointApi;
        if (!timepointApi) return;

        const timepoints = timepointApi.study(studyInstanceUid);
        if (!timepoints || !timepoints.length) {
            return;
        }

        const timepoint = timepoints[0];

        return timepointApi.name(timepoint);
    },

    linked() {
        const linkedViewports = Session.get('StackImagePositionOffsetSynchronizerLinkedViewports') || [];
        return (linkedViewports.indexOf(this.viewportIndex) !== -1);
    }
});
