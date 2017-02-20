import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

class ImageMetadataBuilder {
    constructor() {
        this.tags = {};
    }

    addTag(tag, value, multi) {
        this.tags[tag] = {
            tag,
            value,
            multi
        }

        return this;
    }

    toJSON() {
        const json = {};
        const keys = Object.keys(this.tags);

        keys.forEach(key => {
            if(!this.tags.hasOwnProperty(key)) {
                return;
            }

            const tag = this.tags[key];
            const multi = !!tag.multi;
            const value = tag.value && multi ? tag.value.split('\\') : [tag.value];

            if((value.length === 1) && (value[0] == null)) {
                return;
            }

            json[key] = {
                Value: value
            };
        });

        return json;
    }
}

/**
 * Obtain an imageId for Cornerstone based on the WADO-RS scheme
 *
 * @param {object} instanceMetada metadata object (InstanceMetadata)
 * @returns {string} The imageId to be used by Cornerstone
 */
export function getWADORSImageId(instance) {
    const uri = Meteor.absoluteUrl(instance.wadorsuri);
    const imageId = `wadors:${uri}`;

    const imageMetadata = new ImageMetadataBuilder()
        .addTag('00080016', instance.sopClassUid)
        .addTag('00080018', instance.sopInstanceUid)
        .addTag('00180050', instance.sliceThickness)
        .addTag('00200013', instance.instanceNumber)
        .addTag('00200032', instance.imagePositionPatient, true)
        .addTag('00200037', instance.imageOrientationPatient, true)
        .addTag('00200052', instance.frameOfReferenceUID)
        .addTag('00201041', instance.sliceLocation)
        .addTag('00280002', instance.samplesPerPixel)
        .addTag('00280004', instance.photometricInterpretation)
        .addTag('00280006', instance.planarConfiguration)
        .addTag('00280010', instance.rows)
        .addTag('00280011', instance.columns)
        .addTag('00280030', instance.pixelSpacing, true)
        .addTag('00280034', instance.pixelAspectRatio, true)
        .addTag('00280100', instance.bitsAllocated)
        .addTag('00280101', instance.bitsStored)
        .addTag('00280102', instance.highBit)
        .addTag('00280103', instance.pixelRepresentation)
        .addTag('00280106', instance.smallestPixelValue)
        .addTag('00280107', instance.largestPixelValue)
        .addTag('00281050', instance.windowCenter, true)
        .addTag('00281051', instance.windowWidth, true)
        .addTag('00281052', instance.rescaleIntercept)
        .addTag('00281053', instance.rescaleSlope)
        .addTag('00281054', instance.rescaleType)
        .toJSON();

    _.extend(imageMetadata, {
        uri: uri,
        sizeInBytes: instance.rows * instance.columns * (instance.bitsAllocated / 8),
        instance: instance
    });

    cornerstoneWADOImageLoader.wadors.metaDataManager.add(imageId, imageMetadata);

    OHIF.log.info('WADO-RS ImageID: ' + imageId);
    return imageId;
};
