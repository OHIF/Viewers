import { OHIF } from 'meteor/ohif:core';

/**
 * Obtain an imageId for the given imagePath
 *
 * @param {String} imagePath Path containing study, series and instance UIDs and frame index
 * @returns {String} The resulting imageId for the given imagePath
 */

export const getImageIdForImagePath = (imagePath, thumbnail=false) => {
    const [studyInstanceUid, seriesInstanceUid, sopInstanceUid, frameIndex] = imagePath.split('_');
    let study = OHIF.viewer.Studies.findBy({ studyInstanceUid });
    if (!(study instanceof OHIF.viewerbase.metadata.StudyMetadata)) {
        study = new OHIF.metadata.StudyMetadata(study, study.studyInstanceUid);
    }

    const series = study.getSeriesByUID(seriesInstanceUid);
    const instance = series.getInstanceByUID(sopInstanceUid);
    const imageId = OHIF.viewerbase.getImageId(instance, frameIndex, thumbnail);
    return imageId;
};
