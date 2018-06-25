import { OHIF } from 'meteor/ohif:core';
import { dcmjs } from 'meteor/ohif:cornerstone';
import getLengthMeasurementData from './getLengthMeasurementData';

const toArray = function(x) {
    return (x.constructor.name === "Array" ? x : [x]);
};

const codeMeaningEquals = (codeMeaningName) => {
    return (contentItem) => {
        return contentItem.ConceptNameCodeSequence.CodeMeaning === codeMeaningName;
    };
};

const imagingMeasurementsToMeasurementData = (dataset, displaySets) => {
    // Identify the Imaging Measurements
    const imagingMeasurementContent = toArray(dataset.ContentSequence).find(codeMeaningEquals("Imaging Measurements"));

    // Retrieve the Measurements themselves
    const measurementGroupContent = toArray(imagingMeasurementContent.ContentSequence).find(codeMeaningEquals("Measurement Group"));

    // For now, bail out if the dataset is not a TID1500 SR with length measurements
    // TODO: generalize to the various kinds of report
    // TODO: generalize to the kinds of measurements the Viewer supports
    if (dataset.ContentTemplateSequence.TemplateIdentifier !== "1500") {
        OHIF.log.warn("This package can currently only interpret DICOM SR TID 1500");

        return {};
    }

    // Filter to find Length measurements in the Structured Report
    const lengthMeasurementContent = toArray(measurementGroupContent.ContentSequence).filter(codeMeaningEquals("Length"));

    // Retrieve Length Measurement Data
    return getLengthMeasurementData(lengthMeasurementContent, displaySets);
};

const retrieveDataFromSR = (Part10SRArrayBuffer) => {
    const allStudies = OHIF.viewer.Studies.all();
    const allDisplaySets = [];

    allStudies.forEach(study => {
        allDisplaySets.concat(study.displaySets);
    });

    // get the dicom data as an Object
    let dicomData = dcmjs.data.DicomMessage.readFile(Part10SRArrayBuffer);
    let dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

    // Convert the SR into the kind of object the Measurements package is expecting
    return imagingMeasurementsToMeasurementData(dataset, allDisplaySets);
};

export const handleSR = (series) => {
    const instance = series.getFirstInstance();

    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();

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
};
