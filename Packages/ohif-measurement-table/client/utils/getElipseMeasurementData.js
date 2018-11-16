import {OHIF} from 'meteor/ohif:core';
import {cornerstone} from 'meteor/ohif:cornerstone';
import {getInstanceMetadata} from './srUtils';

export default getElipseMeasurementData = (elipseMeasurementContent, displaySets) => {
    let elipseStates = [];

    elipseMeasurementContent.forEach(groupItemContent => {
        const elipseContent = groupItemContent.ContentSequence;
        const reference = elipseContent.ContentSequence.ReferencedSOPSequence;
        const elipseState = {};
        elipseState.measuredValue = groupItemContent.MeasuredValueSequence.NumericValue;
        elipseState.handles = {start: {}, end: {}};
        [elipseState.handles.start.x,
            elipseState.handles.start.y,
            elipseState.handles.end.x,
            elipseState.handles.end.y] = elipseContent.GraphicData;
        var lenX = elipseState.handles.end.x - elipseState.handles.start.x;
        var lenY = elipseState.handles.end.y - elipseState.handles.start.y;
        var l = Math.sqrt(Math.pow(lenX, 2) + Math.pow(lenY, 2));
        var vX = lenX / l;
        var vY = lenY / l;
        var newend = {};
        var newstart = {};
        var newL = Math.sqrt(2 * Math.pow(l, 2)) - l;
        newstart.x = elipseState.handles.start.x - vX * newL;
        newstart.y = elipseState.handles.start.y - vY * newL;
        newend.x = elipseState.handles.end.x + vX * newL;
        newend.y = elipseState.handles.end.y + vY * newL;
        elipseState.handles.end = newend;
        lenX = elipseState.handles.end.x - elipseState.handles.start.x;
        lenY = elipseState.handles.end.y - elipseState.handles.start.y;
        elipseState.handles.start.x -= lenX;
        elipseState.handles.start.y -= lenY;
        l = Math.sqrt(Math.pow(lenX, 2) + Math.pow(lenY, 2));
        // TODO: Save textbox position in GraphicData?
        elipseState.handles.textBox = {
            hasMoved: false,
            movesIndependently: false,
            drawnIndependently: true,
            allowedOutsideImage: true,
            hasBoundingBox: true
        }

        elipseState.ReferencedInstanceUID = reference.ReferencedSOPInstanceUID;
        if (reference.ReferencedFrameNumber && reference.ReferencedFrameNumber !== 'NaN') {
            elipseState.ReferencedFrameNumber = reference.ReferencedFrameNumber;
        } else {
            elipseState.ReferencedFrameNumber = 0;
        }

        elipseStates.push(elipseState);
    });

    const elipseMeasurementData = [];

    let measurementNumber = 0;
    elipseStates.forEach(epilseState => {
        const sopInstanceUid = epilseState.ReferencedInstanceUID;
        const instanceMetadata = getInstanceMetadata(displaySets, sopInstanceUid);
        const imageId = OHIF.viewerbase.getImageId(instanceMetadata);
        if (!imageId) {
            return;
        }

        const studyInstanceUid = cornerstone.metaData.get('study', imageId).studyInstanceUid;
        const seriesInstanceUid = cornerstone.metaData.get('series', imageId).seriesInstanceUid;
        const patientId = instanceMetadata._study.patientId;
        const frameIndex = epilseState.ReferencedFrameNumber;
        const imagePath = [studyInstanceUid, seriesInstanceUid, sopInstanceUid, frameIndex].join('_');
        const measurement = {
            handles: epilseState.handles,
            length: epilseState.measuredValue,
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
            toolType: 'ellipticalRoi',
            _id: imageId + measurementNumber,
        };

        elipseMeasurementData.push(measurement);
    });


    return elipseMeasurementData;
};
