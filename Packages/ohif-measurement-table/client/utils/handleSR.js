const retrieveDataFromSR = (Part10SRArrayBuffer) => {
    const allStudies = OHIF.viewer.Studies.all();
    const displaySets = allStudies[0].displaySets;

    // get the dicom data as an Object
    let dicomData = dcmjs.data.DicomMessage.readFile(Part10SRArrayBuffer);
    let dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

    // convert the SR into the kind of toolState cornerstoneTools needs
    return imagingMeasurementsToMeasurementData(dataset, displaySets);
}

const imagingMeasurementsToMeasurementData = (dataset, displaySets) => {
    // for now, assume dataset is a TID1500 SR with length measurements
    // TODO: generalize to the various kinds of report
    // TODO: generalize to the kinds of measurements the Viewer supports
    if (dataset.ContentTemplateSequence.TemplateIdentifier !== "1500") {
        console.warn("This code can only interpret TID 1500");

        return({});
    }
    toArray = function(x) { return (x.constructor.name === "Array" ? x : [x]); }

    let lengthStates = [];
    toArray(dataset.ContentSequence).forEach(contentItem => {
        if (contentItem.ConceptNameCodeSequence.CodeMeaning === "Imaging Measurements") {
            toArray(contentItem.ContentSequence).forEach(measurementContent => {
                if (measurementContent.ConceptNameCodeSequence.CodeMeaning === "Measurement Group") {
                    toArray(measurementContent.ContentSequence).forEach(groupItemContent => {
                        if (groupItemContent.ConceptNameCodeSequence.CodeMeaning === "Length") {
                            let lengthState = {};
                            lengthState.measuredValue = groupItemContent.MeasuredValueSequence.NumericValue;
                            const lengthContent = groupItemContent.ContentSequence;
                            lengthState.handles = {start: {}, end: {}};
                            [lengthState.handles.start.x,
                                lengthState.handles.start.y,
                                lengthState.handles.end.x,
                                lengthState.handles.end.y] = lengthContent.GraphicData;
                            const reference = lengthContent.ContentSequence.ReferencedSOPSequence;
                            lengthState.ReferencedInstanceUID = reference.ReferencedSOPInstanceUID;
                            lengthState.ReferencedFrameNumber = reference.ReferencedFrameNumber;
                            lengthStates.push(lengthState);
                        }
                    });
                }
            });
        }
    });
    console.log(lengthStates);

    const getInstanceMetadata = (lengthState) => {
        let instance;
        displaySets.forEach(displaySet => {
            displaySet.images.forEach(instanceMetadata => {
                if (lengthState.ReferencedInstanceUID === instanceMetadata._sopInstanceUID) {
                    instance = instanceMetadata;
                }
            });
        });

        return instance;
    };

    const lengthMeasurementData = [];
    const { PatientID, StudyInstanceUID, FrameIndex } = dataset;

    let measurementNumber = 0;
    lengthStates.forEach(lengthState => {
        const instanceMetadata = getInstanceMetadata(lengthState);
        const imageId = OHIF.viewerbase.getImageId(instanceMetadata);
        if (!imageId) {
            return;
        }

        const studyInstanceUid = StudyInstanceUID;
        const seriesInstanceUid = cornerstone.metaData.get('series', imageId).seriesInstanceUid;
        const sopInstanceUid = lengthState.ReferencedInstanceUID;
        const frameIndex = FrameIndex || 0;
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
            patientId: PatientID,
            toolType: 'length',
            _id: imageId + measurementNumber,
        };

        lengthMeasurementData.push(measurement);
    });


    return lengthMeasurementData;
}

export const handleSR = (series) => {
    const instance = series.getFirstInstance();

    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        request.responseType = 'arraybuffer';
        request.open('GET', instance.getDataProperty('wadouri'));

        request.onload = function (progressEvent) {
            const data = retrieveDataFromSR(progressEvent.currentTarget.response);

            resolve(data);
        };

        request.onerror = function(error) {
            reject(error);
        };

        request.send();
    });
}
