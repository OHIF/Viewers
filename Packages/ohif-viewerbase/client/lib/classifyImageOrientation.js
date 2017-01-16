import { OHIF } from 'meteor/ohif:core';

/**
 * This function returns a string describing an image orientation
 * (e.g. axial, sagittal, coronal)
 * If no classification is determined, it returns undefined
 * 
 * @param {string} [imageId]
 * @returns {string}
 */
export function classifyImageOrientation(imageId) {
    // First we check if this imageId has already been classified, so we can return
    // the classification from the cache
    if (OHIF.viewer.linkSeries.classifiedOrientation.hasOwnProperty(imageId)) {
        return OHIF.viewer.linkSeries.classifiedOrientation[imageId];
    }

    // Calculate the image plane normal
    const imagePlane = cornerstoneTools.metaData.get('imagePlane', imageId);
    if (!imagePlane || !imagePlane.rowCosines || !imagePlane.columnCosines) {
        return;
    }
    const imageNormal = imagePlane.rowCosines.clone().cross(imagePlane.columnCosines);

    // These represent the normal vectors to three standard image planes
    const normals = {
        axial: new cornerstoneMath.Vector3(0, 0, 1),
        coronal: new cornerstoneMath.Vector3(0, 1, 0),
        sagittal: new cornerstoneMath.Vector3(1, 0, 0)
    };

    const PI = Math.PI;
    // This loop checks the angle between the current image plane normal
    // and that of the three standard image planes above. If the two 
    // normal vectors are within 15 degrees of each other, the current image
    // is classified as the relevant standard image plane (e.g. axial).
    let classifiedOrientation;
    Object.keys(normals).some(orientation => {
        let angleInRadians = imageNormal.angleTo(normals[orientation]);

        angleInRadians = Math.abs(angleInRadians);
        if (angleInRadians < PI / 12 || angleInRadians === PI) { // Pi / 12 radians = 15 degrees
            classifiedOrientation = orientation;
            return true;
        }
    });

    // If no classification was determined, stop here and dump a warning to the console
    if (!classifiedOrientation) {
        return;
    }

    // Otherwise, update the cache with the classified orientation for this imageId
    OHIF.viewer.linkSeries.classifiedOrientation[imageId] = classifiedOrientation;

    return classifiedOrientation;
};