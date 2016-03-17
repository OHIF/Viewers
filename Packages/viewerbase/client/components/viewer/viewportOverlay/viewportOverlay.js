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

    if (!element || $(element).hasClass('empty') || canvases.length === 0) {
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
    patientName: function() {
        return getPatient.call(this, 'name');
    },
    patientId: function() {
        return getPatient.call(this, 'id');
    },
    studyDate: function() {
        return getStudy.call(this, 'studyDate');
    },
    studyTime: function() {
        return getStudy.call(this, 'studyTime');
    },
    studyDescription: function() {
        return getStudy.call(this, 'studyDescription');
    },
    seriesDescription: function() {
        return getSeries.call(this, 'seriesDescription');
    },
    frameRate: function() {
        var frameTime = getInstance.call(this, 'frameTime');
        if (!frameTime) {
            return;
        }
        
        var frameRate = 1000 / frameTime;
        return frameRate.toFixed(1);
    },
    seriesNumber: function() {
        return getSeries.call(this, 'seriesNumber');
    },
    imageNumber: function() {
        return getInstance.call(this, 'instanceNumber');
    },
    imageIndex: function() {
        return getInstance.call(this, 'index');
    },
    numImages: function() {
        return getSeries.call(this, 'numImages');
    },
    prior: function() {
        // This helper is updated whenever a new image is displayed in the viewport
        Session.get('CornerstoneNewImage' + this.viewportIndex);
        if (!this.imageId) {
            return;
        }

        // Make sure there are more than two studies loaded in the viewer
        //
        // Here we sort the collection in ascending order by study date, so
        // that we can obtain the oldest study as the first element of the array
        //
        // TODO= Find out if we should encode studyDate as a Date in the ViewerStudies Collection
        var viewportStudies = ViewerStudies.find({}, {
            sort: {
                studyDate: 1
            }
        });
        if (viewportStudies.count() < 2) {
            return;
        }

        // Get study data
        var study = cornerstoneTools.metaData.get('study', this.imageId);
        if (study.studyDate === viewportStudies.fetch()[0].studyDate) {
            return 'Prior';
        }
    }
});
