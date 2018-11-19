import { OHIF } from 'meteor/ohif:core';
import { Router } from 'meteor/iron:router';

// Functions
import { getStudyPriors } from './getStudyPriors';
import { getStudyPriorsMap } from './getStudyPriorsMap';
import {Meteor} from "meteor/meteor";

OHIF.studylist.functions = {
    getStudyPriors,
    getStudyPriorsMap
};

// Add deprecation notice to the OHIF.studylist.classes namespace
const note = 'OHIF.studylist.classes is deprecated.';
const instructions = 'Please use OHIF.studies.classes instead.';
Object.defineProperty(OHIF.studylist, 'classes', {
    get() {
        OHIF.log.warn(`${note}\n${instructions}`);
        return OHIF.studies.classes;
    }
});

const dblClickOnStudy = data => {
    Router.go('viewerStudies', { studyInstanceUids: data.studyInstanceUid });
};

Meteor.startup(function() {
    if (!OHIF.studylist) return;

    OHIF.studylist.callbacks.dblClickOnStudy = dblClickOnStudy;
    OHIF.studylist.callbacks.middleClickOnStudy = dblClickOnStudy;

    OHIF.studylist.timepointApi = new OHIF.measurements.TimepointApi();
});