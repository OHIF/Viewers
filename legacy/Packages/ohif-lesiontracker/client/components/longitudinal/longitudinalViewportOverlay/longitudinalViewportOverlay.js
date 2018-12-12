import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { moment } from 'meteor/momentjs:moment';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

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
});

Template[defaultTemplate].onRendered(() => {
    const instance = Template.instance();
    const { studyInstanceUid, seriesInstanceUid } = instance.data;

    instance.autorun(computation => {
        Session.get('CornerstoneNewImage' + instance.data.viewportIndex);
        if (computation.firstRun) return;
        computation.stop();
        const imageIndex = instance.getImageIndex();

        if (!studyInstanceUid || !seriesInstanceUid) {
          return;
        }

        OHIF.studies.loadStudy(studyInstanceUid).then(study => {
            const studyMetadata = OHIF.viewerbase.getStudyMetadata(study);
            const seriesMetadata = studyMetadata.getSeriesByUID(seriesInstanceUid);
            const instanceMetadata = seriesMetadata.getInstanceByIndex(imageIndex);
            if (!instanceMetadata) return;
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

        const patientAge = instance.getValueByTagKeyword('PatientAge');
        const patientBirthDate = instance.getValueByTagKeyword('PatientBirthDate');
        if (patientAge) {
            values.push(patientAge);
        } else if (patientBirthDate) {
            const date = moment(patientBirthDate, 'YYYYMMDD');
            const yearDiff = moment().diff(date, 'years');
            if (yearDiff) {
                values.push((yearDiff + 'Y').padStart(4, '0'));
            } else {
                const monthDiff = moment().diff(date, 'months');
                if (monthDiff) {
                    values.push((monthDiff + 'M').padStart(4, '0'));
                } else {
                    const dayDiff = moment().diff(date, 'days') || 0;
                    values.push((dayDiff + 'D').padStart(4, '0'));
                }
            }
        }

        return values.filter(value => !!value).join(', ');
    },

    thickness() {
        const instance = Template.instance();
        Session.get('CornerstoneNewImage' + instance.data.viewportIndex);

        return instance.getValueByTagKeyword('SliceThickness');
    },

    location() {
        const instance = Template.instance();
        Session.get('CornerstoneNewImage' + instance.data.viewportIndex);

        const sliceLocation = instance.getValueByTagKeyword('SliceLocation');
        const tablePosition = instance.getValueByTagKeyword('TablePosition');
        const imagePositionPatient = instance.getValueByTagKeyword('ImagePositionPatient');
        return sliceLocation || tablePosition || imagePositionPatient;
    },

    spacingBetweenSlices() {
        const instance = Template.instance();
        Session.get('CornerstoneNewImage' + instance.data.viewportIndex);

        // TODO: Otherwise, displays a value derived from successive values
        // of Image Position (Patient) (0020,0032) perpendicular to
        // the Image Orientation (Patient) (0020,0037)

        return instance.getValueByTagKeyword('SpacingBetweenSlices');
    },

    zoom() {
        const instance = Template.instance();
        const { viewportIndex } = instance.data;
        const { getElementIfNotEmpty } = OHIF.viewerbase;
        Session.get('CornerstoneImageRendered' + viewportIndex);

        const element = getElementIfNotEmpty(viewportIndex);
        if (!element) return;

        const viewport = cornerstone.getViewport(element);
        if (!viewport) return;

        return viewport.scale;
    },

    wwwc() {
        const instance = Template.instance();
        const { viewportIndex } = instance.data;
        const { getElementIfNotEmpty, wlPresets } = OHIF.viewerbase;
        Session.get('CornerstoneImageRendered' + viewportIndex);
        wlPresets.changeObserver.depend();

        const element = getElementIfNotEmpty(viewportIndex);
        if (!element) return;

        const viewport = cornerstone.getViewport(element);
        if (!viewport) return;

        const ww = viewport.voi.windowWidth.toFixed(0);
        const wc = viewport.voi.windowCenter.toFixed(0);
        const result = [`W: ${ww}, L: ${wc}`];

        // Check if there's a preset with this W/L
        const preset = _.findWhere(OHIF.viewer.wlPresets, {
            ww: parseInt(ww),
            wc: parseInt(wc)
        });

        // Append the preset name to the result if found
        if (preset) {
            result .push(`(${preset.id})`);
        }

        return result.join(' ');
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
