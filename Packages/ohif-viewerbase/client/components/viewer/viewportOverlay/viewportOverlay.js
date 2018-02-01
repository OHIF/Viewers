import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';
import { viewportOverlayUtils } from '../../../lib/viewportOverlayUtils';
import { getElementIfNotEmpty } from '../../../lib/getElementIfNotEmpty';
import { getStackDataIfNotEmpty } from '../../../lib/getStackDataIfNotEmpty';

Template.viewportOverlay.onCreated(() => {
    const instance = Template.instance();

    instance.getImageIndex = () => {
        const stack = getStackDataIfNotEmpty(instance.data.viewportIndex);
        if (!stack || stack.currentImageIdIndex === undefined) return;

        return stack.currentImageIdIndex;
    };
});

Template.viewportOverlay.helpers({
    wwwc() {
        Session.get('CornerstoneImageRendered' + this.viewportIndex);

        const element = getElementIfNotEmpty(this.viewportIndex);
        if (!element) {
            return '';
        }

        const viewport = cornerstone.getViewport(element);
        if (!viewport) {
            return '';
        }

        return 'W ' + viewport.voi.windowWidth.toFixed(0) + ' L ' + viewport.voi.windowCenter.toFixed(0);
    },

    zoom() {
        Session.get('CornerstoneImageRendered' + this.viewportIndex);

        const element = getElementIfNotEmpty(this.viewportIndex);
        if (!element) {
            return;
        }

        const viewport = cornerstone.getViewport(element);
        if (!viewport) {
            return;
        }

        return (viewport.scale * 100.0);
    },

    imageDimensions() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        const image = viewportOverlayUtils.getImage(this.viewportIndex);
        if (!image) {
            return '';
        }

        return image.width + ' x ' + image.height;
    },

    patientName() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getPatient.call(this, 'name');
    },

    patientId() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getPatient.call(this, 'id');
    },

    patientBirthDate() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getPatient.call(this, 'birthDate');
    },

    patientSex() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getPatient.call(this, 'sex');
    },

    studyDate() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getStudy.call(this, 'studyDate');
    },

    studyTime() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getStudy.call(this, 'studyTime');
    },

    studyDescription() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getStudy.call(this, 'studyDescription');
    },

    seriesDescription() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getSeries.call(this, 'seriesDescription');
    },

    frameRate() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        const frameTime = viewportOverlayUtils.getInstance.call(this, 'frameTime');
        if (!frameTime) {
            return;
        }

        const frameRate = 1000 / frameTime;
        return frameRate.toFixed(1);
    },

    seriesNumber() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getSeries.call(this, 'seriesNumber');
    },

    instanceNumber() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getInstance.call(this, 'instanceNumber');
    },

    thickness() {
        // Displays Slice Thickness (0018,0050)

        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getInstance.call(this, 'sliceThickness');
    },

    location() {
        // Displays Slice Location (0020,1041), if present.
        // - Otherwise, displays Table Position (0018,9327)
        // - TODO: Otherwise, displays a value derived from Image Position (Patient) (0020,0032)

        Session.get('CornerstoneNewImage' + this.viewportIndex);
        const sliceLocation = viewportOverlayUtils.getInstance.call(this, 'sliceLocation');
        if (sliceLocation !== '') {
            return sliceLocation;
        }

        const tablePosition = viewportOverlayUtils.getInstance.call(this, 'tablePosition');
        if (tablePosition !== '') {
            return tablePosition;
        }

        return viewportOverlayUtils.getInstance.call(this, 'imagePositionPatient');
    },

    spacingBetweenSlices() {
        // Displays Spacing Between Slices (0018,0088), if present.

        // TODO: Otherwise, displays a value derived from successive values
        // of Image Position (Patient) (0020,0032) perpendicular to
        // the Image Orientation (Patient) (0020,0037)

        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getInstance.call(this, 'spacingBetweenSlices');
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

        const instance = cornerstone.metaData.get('instance', this.imageId);
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

    tagDisplayLeftOnly() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getTagDisplay.call(this, 'side') === 'L';
    },

    tagDisplayRightOnly() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getTagDisplay.call(this, 'side') === 'R';
    },

    tagDisplaySpecified() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getTagDisplay.call(this, 'side');
    },

    imageNumber() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        return viewportOverlayUtils.getInstance.call(this, 'number');
    },

    imageIndex() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        const imageIndex = Template.instance().getImageIndex();
        return _.isUndefined(imageIndex) ? 0 : imageIndex + 1;
    },

    numImages() {
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        const stack = getStackDataIfNotEmpty(this.viewportIndex);
        if (!stack || !stack.imageIds) {
            return;
        }

        return stack.imageIds.length;
    },

    prior() {
        // This helper is updated whenever a new image is displayed in the viewport
        Session.get('CornerstoneNewImage' + this.viewportIndex);

        if (!this.imageId) {
            return;
        }

        // @TypeSafeStudies
        // Make sure there are more than two studies loaded in the viewer
        const viewportStudies = OHIF.viewer.Studies.all();
        if (viewportStudies.length < 2) {
            return;
        }

        // Here we sort the collection in ascending order by study date, so
        // that we can obtain the oldest study as the first element of the array
        //
        // TODO= Find out if we should encode studyDate as a Date in the OHIF.viewer.Studies Collection
        const viewportStudiesArray = _.sortBy(viewportStudies, function(study) {
            return viewportOverlayUtils.formatDateTime(study.studyDate, study.studyTime);
        });

        // Get study data
        const study = cornerstone.metaData.get('study', this.imageId);
        if (!study) {
            return;
        }

        const oldestStudy = viewportStudiesArray[0];
        if (viewportOverlayUtils.formatDateTime(study.studyDate, study.studyTime) <= viewportOverlayUtils.formatDateTime(oldestStudy.studyDate, oldestStudy.studyTime)) {
            return 'Prior';
        }
    }
});
