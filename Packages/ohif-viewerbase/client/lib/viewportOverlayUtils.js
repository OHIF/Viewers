import { cornerstone } from 'meteor/ohif:cornerstone';
import { getElementIfNotEmpty } from './getElementIfNotEmpty';

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

const formatDateTime = (date, time) => `${date} ${time}`;

const viewportOverlayUtils = {
    getPatient,
    getStudy,
    getSeries,
    getInstance,
    getTagDisplay,
    getImage,
    formatDateTime
};

export { viewportOverlayUtils };
