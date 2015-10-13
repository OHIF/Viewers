function getElementIfNotEmpty(viewportIndex) {
    // Meteor template helpers run more often than expected
    // They often seem to run just before the whole template is rendered
    // This meant that the onRendered event hadn't fired yet, so the
    // element wasn't enabled / set empty yet. The check here
    // for canvases under the 'enabled' element div is to prevent
    // 'undefined' errors from the helper functions

    var imageViewerViewports = $('.imageViewerViewport'),
        element = imageViewerViewports.get(viewportIndex),
        canvases = imageViewerViewports.eq(viewportIndex).find('canvas');

    if (!element || $(element).hasClass("empty") || canvases.length === 0) {
        return;
    }

    // Check to make sure the element is enabled.
    try {
        var enabledElement = cornerstone.getEnabledElement(element);
    } catch(error) {
        return;
    }
    return element;
}

function getPatient(property) {
    Session.get('CornerstoneNewImage' + this.viewportIndex);
    if (!this.imageId) {
        return false;
    }
    var patient = cornerstoneTools.metaData.get('patient', this.imageId);
    if (!patient) {
        return '';
    }
    return patient[property];
}

function getStudy(property) {
    Session.get('CornerstoneNewImage' + this.viewportIndex);
    if (!this.imageId) {
        return false;
    }
    var study = cornerstoneTools.metaData.get('study', this.imageId);
    if (!study) {
        return '';
    }
    return study[property];
}

function getSeries(property) {
    Session.get('CornerstoneNewImage' + this.viewportIndex);
    if (!this.imageId) {
        return false;
    }
    var series = cornerstoneTools.metaData.get('series', this.imageId);
    if (!series) {
        return '';
    }
    return series[property];
}

function getInstance(property) {
    Session.get('CornerstoneNewImage' + this.viewportIndex);
    if (!this.imageId) {
        return false;
    }
    var instance = cornerstoneTools.metaData.get('instance', this.imageId);
    if (!instance) {
        return '';
    }
    return instance[property];
}

function getImage(viewportIndex) {
    var element = getElementIfNotEmpty(viewportIndex);
    if (!element) {
        return false;
    }
    var enabledElement;
    try {
        enabledElement = cornerstone.getEnabledElement(element);
    } catch(error) {
        return false;
    }
    if (!enabledElement || !enabledElement.image) {
        return false;
    }
    return enabledElement.image;
}

Template.viewportOverlay.helpers({
    wwwc: function() {
        Session.get('CornerstoneImageRendered' + this.viewportIndex);
        var element = getElementIfNotEmpty(this.viewportIndex);
        if (!element) {
            return '';
        }
        var viewport = cornerstone.getViewport(element);
        if (!viewport) {
            return '';
        }
        return 'W ' + viewport.voi.windowWidth.toFixed(0) + ' L ' + viewport.voi.windowCenter.toFixed(0);
    },
    zoom: function() {
        Session.get('CornerstoneImageRendered' + this.viewportIndex);
        var element = getElementIfNotEmpty(this.viewportIndex);
        if (!element) {
            return '';
        }
        var viewport = cornerstone.getViewport(element);
        if (!viewport) {
            return '';
        }
        return (viewport.scale * 100.0);
    },
    imageDimensions: function() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        var image = getImage(this.viewportIndex);
        if (!image) {
           return '';
        }
        return image.width + ' x ' + image.height;
    },
    patientName : function() {
        return getPatient.call(this, 'name');
    },
    patientId : function() {
        return getPatient.call(this, 'id');
    },
    studyDate : function() {
        return getStudy.call(this, 'date');
    },
    studyTime : function() {
        return getStudy.call(this, 'time');
    },
    studyDescription : function() {
        return getStudy.call(this, 'description');
    },
    seriesDescription : function() {
        return getSeries.call(this, 'description');
    },
    seriesNumber : function() {
        return getSeries.call(this, 'number');
    },
    imageNumber : function() {
        return getInstance.call(this, 'number');
    },
    imageIndex : function() {
        return getInstance.call(this, 'index');
    },
    numImages : function() {
        return getSeries.call(this, 'numImages');
    }
});