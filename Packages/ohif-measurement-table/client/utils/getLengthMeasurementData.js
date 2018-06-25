import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

function getInstanceMetadata (displaySets, sopInstanceUid) {
    let instance;

    // Use Array.some so that this loop stops when the internal loop
    // has found the correct instance
    displaySets.some(displaySet => {
        // Search the display set to find the instance metadata for
        return displaySet.images.find(instanceMetadata => {
            if (instanceMetadata._sopInstanceUID === sopInstanceUid) {
                instance = instanceMetadata;

                return true;
            }
        });
    });

    return instance;
};

export default function getLengthMeasurementData(lengthMeasurementContent, displaySets) {
    let lengthStates = [];

    lengthMeasurementContent.forEach(groupItemContent => {
        const lengthContent = groupItemContent.ContentSequence;
        const reference = lengthContent.ContentSequence.ReferencedSOPSequence;
        const lengthState = {};

        lengthState.measuredValue = groupItemContent.MeasuredValueSequence.NumericValue;
        lengthState.handles = {start: {}, end: {}};
        [lengthState.handles.start.x,
            lengthState.handles.start.y,
            lengthState.handles.end.x,
            lengthState.handles.end.y] = lengthContent.GraphicData;

        lengthState.ReferencedInstanceUID = reference.ReferencedSOPInstanceUID;
        lengthState.ReferencedFrameNumber = reference.ReferencedFrameNumber;

        lengthStates.push(lengthState);
    });

    const lengthMeasurementData = [];

    let measurementNumber = 0;
    lengthStates.forEach(lengthState => {
        const sopInstanceUid = lengthState.ReferencedInstanceUID;
        const instanceMetadata = getInstanceMetadata(displaySets, sopInstanceUid);
        const imageId = OHIF.viewerbase.getImageId(instanceMetadata);
        if (!imageId) {
            return;
        }

        const studyInstanceUid = cornerstone.metaData.get('study', imageId).studyInstanceUid;
        const seriesInstanceUid = cornerstone.metaData.get('series', imageId).seriesInstanceUid;
        const frameIndex = lengthState.ReferencedFrameNumber || 0;
        const imagePath = [studyInstanceUid, seriesInstanceUid, sopInstanceUid, frameIndex].join('_');
        const measurement = {
            handles: lengthState.handles,
            length: lengthState.measuredValue,
            imageId,
            imagePath,
            sopInstanceUid,
            seriesInstanceUid,
            studyInstanceUid,
            frameIndex,
            measurementNumber: ++measurementNumber,
            userId: 'UserID',
            timepointId: OHIF.viewer.data.currentTimepointId,
            toolType: 'length',
            _id: imageId + measurementNumber,
        };

        lengthMeasurementData.push(measurement);
    });


    return lengthMeasurementData;
};
