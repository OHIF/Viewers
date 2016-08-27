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

function getStackDataIfNotEmpty(viewportIndex) {
    const element = getElementIfNotEmpty(viewportIndex);
    if (!element) {
        return;
    }

    const stackToolData = cornerstoneTools.getToolState(element, 'stack');
    if (!stackToolData ||
        !stackToolData.data ||
        !stackToolData.data.length) {
        return;
    }

    const stack = stackToolData.data[0];
    if (!stack) {
        return;
    }

    return stack;
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

function getTagDisplay(property) {
    Session.get('CornerstoneNewImage' + this.viewportIndex);
    if (!this.imageId) {
        return false;
    }

    var instance = cornerstoneTools.metaData.get('tagDisplay', this.imageId);
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
            return;
        }

        var viewport = cornerstone.getViewport(element);
        if (!viewport) {
            return;
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
    patientBirthDate: function() {
        return getPatient.call(this, 'birthDate');
    },
    patientSex: function() {
        return getPatient.call(this, 'sex');
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
    instanceNumber: function() {
        return getInstance.call(this, 'instanceNumber');
    },
    thickness() {
        // Displays Slice Thickness (0018,0050)
        return getInstance.call(this, 'sliceThickness');
    },

    location() {
        // Displays Slice Location (0020,1041), if present.
        // - Otherwise, displays Table Position (0018,9327)
        // - TODO: Otherwise, displays a value derived from Image Position (Patient) (0020,0032)
        const sliceLocation = getInstance.call(this, 'sliceLocation');
        if (sliceLocation !== '') {
            return sliceLocation;
        }

        const tablePosition = getInstance.call(this, 'tablePosition');
        if (tablePosition !== '') {
            return tablePosition;
        }

        return getInstance.call(this, 'imagePositionPatient');
    },

    spacingBetweenSlices() {
        // Displays Spacing Between Slices (0018,0088), if present.

        // TODO: Otherwise, displays a value derived from successive values
        // of Image Position (Patient) (0020,0032) perpendicular to
        // the Image Orientation (Patient) (0020,0037)
        return getInstance.call(this, 'spacingBetweenSlices');
    },

    compression() {
        // Displays whether or not lossy compression has been applied:
        //
        // - Checks Lossy Image Compression (0028,2110)
        // - If so, displays the value of Lossy Image Compression Ratio (0028,2112)
        //          and Lossy Image Compression Method (0028,2114)

        Session.get('CornerstoneNewImage' + this.viewportIndex);
        if (!this.imageId) {
            return false;
        }

        var instance = cornerstoneTools.metaData.get('instance', this.imageId);
        if (!instance) {
            return '';
        }

        if (instance.lossyImageCompression === '01' &&
            instance.lossyImageCompressionRatio !== '') {
            const compressionMethod = instance.lossyImageCompressionMethod || 'Lossy: ';
            const compressionRatio = parseFloat(instance.lossyImageCompressionRatio).toFixed(2);
            return compressionMethod + compressionRatio + ' : 1';
        }

        return 'Lossless / Uncompressed';
    },

    tagDisplayLeftOnly: function() {
        return getTagDisplay.call(this, 'side') === 'L';
    },
    tagDisplayRightOnly: function() {
        return getTagDisplay.call(this, 'side') === 'R';
    },
    tagDisplaySpecified: function() {
        return getTagDisplay.call(this, 'side');
    },
    imageIndex: function() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);
        var stack = getStackDataIfNotEmpty(this.viewportIndex);
        if (!stack || stack.currentImageIdIndex === undefined) {
            return;
        }

        return stack.currentImageIdIndex + 1;
    },
    numImages: function() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);
        var stack = getStackDataIfNotEmpty(this.viewportIndex);
        if (!stack || !stack.imageIds) {
            return;
        }

        return stack.imageIds.length;
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
