import { getElementIfNotEmpty } from './getElementIfNotEmpty';
import { OHIF } from 'meteor/ohif:core';
import {Session} from "meteor/session";
import { $ } from 'meteor/jquery';

const getPatient = function(property) {
    if (!this.imageId) {
        return false;
    }

    const patient = cornerstone.metaData.get('patient', this.imageId);
    if (!patient) {
        return '';
    }

    return patient[property];
};

const getStudy = function(property) {
    if (!this.imageId) {
        return false;
    }

    const study = cornerstone.metaData.get('study', this.imageId);
    if (!study) {
        return '';
    }
    
    return study[property];
};

const getSeries = function(property) {
    if (!this.imageId) {
        return false;
    }

    const series = cornerstone.metaData.get('series', this.imageId);
    if (!series) {
        return '';
    }

    return series[property];
};

const getInstance = function(property) {
    if (!this.imageId) {
        return false;
    }

    const instance = cornerstone.metaData.get('instance', this.imageId);
    if (!instance) {
        return '';
    }

    return instance[property];
};

const getTagDisplay = function(property) {
    if (!this.imageId) {
        return false;
    }

    const instance = cornerstone.metaData.get('tagDisplay', this.imageId);
    if (!instance) {
        return '';
    }

    return instance[property];
};

const getImage = function(viewportIndex) {
    const element = getElementIfNotEmpty(viewportIndex);
    if (!element) {
        return false;
    }

    let enabledElement;
    try {
        enabledElement = cornerstone.getEnabledElement(element);
    } catch(error) {
        return false;
    }

    if (!enabledElement || !enabledElement.image) {
        return false;
    }

    return enabledElement.image;
};

const render3D = () => {
    const viewportIndex = Session.get('activeViewport') || 0;
    let activeElement = getElementIfNotEmpty(viewportIndex)
    let element = OHIF.viewerbase.viewportUtils.getEnabledElement(activeElement);
    let e = {imageId: element.image.imageId};
    let serieInstanceUid = getSeries.call(e, 'seriesInstanceUid');
    let studyInstanceUid = getStudy.call(e, 'studyInstanceUid');

    let eventData = {studyId: studyInstanceUid, serieId: serieInstanceUid};

    const customEvent = $.Event("Render3D", eventData);

    customEvent.type = 'Render3D';

    const $element = $(activeElement);
    $element.trigger(customEvent, eventData);
}



const formatDateTime = (date, time) => `${date} ${time}`;

const viewportOverlayUtils = {
    getPatient,
    getStudy,
    getSeries,
    getInstance,
    getTagDisplay,
    getImage,
    formatDateTime,
    render3D
};

export { viewportOverlayUtils };
