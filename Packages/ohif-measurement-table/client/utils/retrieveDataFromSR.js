import { dcmjs } from 'meteor/ohif:cornerstone';
import getLengthMeasurementData from './getLengthMeasurementData';
import { toArray, codeMeaningEquals, getAllDisplaySets } from './srUtils'

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

export default retrieveDataFromSR = (Part10SRArrayBuffer) => {
    const allDisplaySets = getAllDisplaySets();

    // get the dicom data as an Object
    let dicomData = dcmjs.data.DicomMessage.readFile(Part10SRArrayBuffer);
    let dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

    // Convert the SR into the kind of object the Measurements package is expecting
    return imagingMeasurementsToMeasurementData(dataset, allDisplaySets);
};
