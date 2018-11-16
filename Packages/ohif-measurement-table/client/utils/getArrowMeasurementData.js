import {OHIF} from 'meteor/ohif:core';
import {cornerstone} from 'meteor/ohif:cornerstone';
import {getInstanceMetadata} from './srUtils';

export default getArrowMeasurementData = (arrowMeasurementContent, displaySets) => {
    let arrowStates = [];

    arrowMeasurementContent.forEach(groupItemContent => {
        const arrowContent = groupItemContent.ContentSequence;
        const reference = arrowContent.ContentSequence.ReferencedSOPSequence;
        const arrowState = {};

        arrowState.measuredValue = groupItemContent.MeasuredValueSequence.NumericValue;
        arrowState.handles = {start: {}, end: {}};
        [arrowState.handles.start.x,
            arrowState.handles.start.y,
            arrowState.handles.end.x,
            arrowState.handles.end.y] = arrowContent.GraphicData;

        // TODO: Save textbox position in GraphicData?
        arrowState.handles.textBox = {
            hasMoved: false,
            movesIndependently: false,
            drawnIndependently: true,
            allowedOutsideImage: true,
            hasBoundingBox: true
        }

        arrowState.ReferencedInstanceUID = reference.ReferencedSOPInstanceUID;
        if (reference.ReferencedFrameNumber && reference.ReferencedFrameNumber !== 'NaN') {
            arrowState.ReferencedFrameNumber = reference.ReferencedFrameNumber;
        } else {
            arrowState.ReferencedFrameNumber = 0;
        }
        arrowState.text = groupItemContent.text;
        arrowStates.push(arrowState);
    });

    const arrowMeasurementData = [];

    let measurementNumber = 0;
    arrowStates.forEach(arrowState => {
        const sopInstanceUid = arrowState.ReferencedInstanceUID;
        const instanceMetadata = getInstanceMetadata(displaySets, sopInstanceUid);
        const imageId = OHIF.viewerbase.getImageId(instanceMetadata);
        if (!imageId) {
            return;
        }

        const studyInstanceUid = cornerstone.metaData.get('study', imageId).studyInstanceUid;
        const seriesInstanceUid = cornerstone.metaData.get('series', imageId).seriesInstanceUid;
        const patientId = instanceMetadata._study.patientId;
        const frameIndex = arrowState.ReferencedFrameNumber;
        const imagePath = [studyInstanceUid, seriesInstanceUid, sopInstanceUid, frameIndex].join('_');
        const measurement = {
            handles: arrowState.handles,
            length: -1,
            imageId,
            imagePath,
            sopInstanceUid,
            seriesInstanceUid,
            studyInstanceUid,
            patientId,
            frameIndex,
            text: arrowState.text,
            measurementNumber: ++measurementNumber,
            userId: 'UserID',
            timepointId: OHIF.viewer.data.currentTimepointId,
            toolType: 'arrowAnnotate',
            _id: imageId + measurementNumber,
        };
        arrowMeasurementData.push(measurement);
    });


    return arrowMeasurementData;
};
