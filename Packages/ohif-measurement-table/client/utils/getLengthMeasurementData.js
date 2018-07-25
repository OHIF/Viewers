import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';
import { getInstanceMetadata } from './srUtils';

export default getLengthMeasurementData = (lengthMeasurementContent, displaySets) => {
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

        // TODO: Save textbox position in GraphicData?
        lengthState.handles.textBox = {
            hasMoved: false,
            movesIndependently: false,
            drawnIndependently: true,
            allowedOutsideImage: true,
            hasBoundingBox: true
        }

        lengthState.ReferencedInstanceUID = reference.ReferencedSOPInstanceUID;
        if (reference.ReferencedFrameNumber && reference.ReferencedFrameNumber !== 'NaN') {
            lengthState.ReferencedFrameNumber = reference.ReferencedFrameNumber;
        } else {
            lengthState.ReferencedFrameNumber = 0;
        }

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
        const patientId = instanceMetadata._study.patientId;
        const frameIndex = lengthState.ReferencedFrameNumber;
        const imagePath = [studyInstanceUid, seriesInstanceUid, sopInstanceUid, frameIndex].join('_');
        const measurement = {
            handles: lengthState.handles,
            length: lengthState.measuredValue,
            imageId,
            imagePath,
            sopInstanceUid,
            seriesInstanceUid,
            studyInstanceUid,
            patientId,
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
