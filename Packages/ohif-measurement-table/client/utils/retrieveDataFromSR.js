import {dcmjs} from 'meteor/ohif:cornerstone';
import getLengthMeasurementData from './getLengthMeasurementData';
import getElipseMeasurementData from './getElipseMeasurementData';
import getArrowMeasurementData from './getArrowMeasurementData';
import {toArray, graphicTypeEquals, codeMeaningEquals, getAllDisplaySets} from './srUtils'

const imagingMeasurementsToMeasurementData = (dataset, displaySets) => {
    // Identify the Imaging Measurements
    var imagingMeasurementsContent;
    var imagingMeasurementsContentElipse;
    if (dataset.GraphicAnnotationSequence) {
        var arrayGraphic = [];
        var arrayText = [];
        dataset.GraphicAnnotationSequence.forEach(function (element) {
            arrayGraphic = arrayGraphic.concat(element.GraphicObjectSequence);
            if (element.TextObjectSequence) {
                arrayText = arrayText.concat(element.TextObjectSequence);
            }
        });
        imagingMeasurementsContent = toArray(arrayGraphic).filter(graphicTypeEquals("POLYLINE"));
        imagingMeasurementsContent = imagingMeasurementsContent.concat(toArray(arrayGraphic).filter(graphicTypeEquals("INTERPOLATED")));
        imagingMeasurementsContentElipse = toArray(arrayGraphic).filter(graphicTypeEquals("CIRCLE"));
        var lineMeasurementContent = [];
        var elipseMeasurementContent = [];
        var arrowMeasurementContent = [];
        toArray(imagingMeasurementsContent).forEach(function (element) {
            for (var i = 0; i < element.GraphicData.length - 2; i += 2) {
                var line = {};
                line.ConceptNameCodeSequence = {};
                line.ContentSequence = {};
                line.ContentSequence.GraphicType = element.GraphicType;
                line.ContentSequence.GraphicData = element.GraphicData.slice(i, i + 4);
                line.ContentSequence.RelationshipType = "INFERRED FROM";
                line.ContentSequence.ValueType = element.LineStyleSequence.LineDashingStyle;
                line.ContentSequence.ContentSequence = {};
                line.ContentSequence.ContentSequence.ReferencedSOPSequence = {};
                line.ContentSequence.ContentSequence.ReferencedSOPSequence.ReferencedSOPClassUID = dataset.ReferencedSeriesSequence.ReferencedImageSequence.ReferencedSOPClassUID;
                line.ContentSequence.ContentSequence.ReferencedSOPSequence.ReferencedSOPInstanceUID = dataset.ReferencedSeriesSequence.ReferencedImageSequence.ReferencedSOPInstanceUID;
                line.MeasuredValueSequence = {};
                line.MeasuredValueSequence.MeasurementUnitsCodeSequence = {};
                line.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodeMeaning = "millimeter";
                line.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodeValue = "mm";
                line.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodingSchemeDesignator = "UCUM";
                line.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodingSchemeVersion = "1.4";
                lineMeasurementContent.push(line);
            }
        });
        toArray(imagingMeasurementsContentElipse).forEach(function (element) {
            var elipse = {};
            elipse.ConceptNameCodeSequence = {};
            elipse.ContentSequence = {};
            elipse.ContentSequence.GraphicType = element.GraphicType;
            elipse.ContentSequence.GraphicData = element.GraphicData;
            elipse.ContentSequence.RelationshipType = "INFERRED FROM";
            elipse.ContentSequence.ValueType = element.LineStyleSequence.LineDashingStyle;
            elipse.ContentSequence.ContentSequence = {};
            elipse.ContentSequence.ContentSequence.ReferencedSOPSequence = {};
            elipse.ContentSequence.ContentSequence.ReferencedSOPSequence.ReferencedSOPClassUID = dataset.ReferencedSeriesSequence.ReferencedImageSequence.ReferencedSOPClassUID;
            elipse.ContentSequence.ContentSequence.ReferencedSOPSequence.ReferencedSOPInstanceUID = dataset.ReferencedSeriesSequence.ReferencedImageSequence.ReferencedSOPInstanceUID;
            elipse.MeasuredValueSequence = {};
            elipse.MeasuredValueSequence.MeasurementUnitsCodeSequence = {};
            elipse.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodeMeaning = "millimeter";
            elipse.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodeValue = "mm";
            elipse.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodingSchemeDesignator = "UCUM";
            elipse.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodingSchemeVersion = "1.4";
            elipseMeasurementContent.push(elipse);
        });

        toArray(arrayText).forEach(function (element) {
            var arrow = {};
            arrow.ConceptNameCodeSequence = {};
            arrow.ContentSequence = {};
            arrow.ContentSequence.GraphicType = element.GraphicType;
            arrow.ContentSequence.GraphicData = element.BoundingBoxTopLeftHandCorner.concat(element.BoundingBoxTopLeftHandCorner);
            arrow.ContentSequence.RelationshipType = "INFERRED FROM";
            arrow.ContentSequence.ValueType = "none";
            arrow.ContentSequence.ContentSequence = {};
            arrow.ContentSequence.ContentSequence.ReferencedSOPSequence = {};
            arrow.ContentSequence.ContentSequence.ReferencedSOPSequence.ReferencedSOPClassUID = dataset.ReferencedSeriesSequence.ReferencedImageSequence.ReferencedSOPClassUID;
            arrow.ContentSequence.ContentSequence.ReferencedSOPSequence.ReferencedSOPInstanceUID = dataset.ReferencedSeriesSequence.ReferencedImageSequence.ReferencedSOPInstanceUID;
            arrow.MeasuredValueSequence = {};
            arrow.MeasuredValueSequence.MeasurementUnitsCodeSequence = {};
            arrow.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodeMeaning = "millimeter";
            arrow.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodeValue = "mm";
            arrow.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodingSchemeDesignator = "UCUM";
            arrow.MeasuredValueSequence.MeasurementUnitsCodeSequence.CodingSchemeVersion = "1.4";
            arrow.text = element.UnformattedTextValue.replace(/Â/g,'');
            arrowMeasurementContent.push(arrow);
        });
        return getElipseMeasurementData(elipseMeasurementContent, displaySets).concat(getLengthMeasurementData(lineMeasurementContent, displaySets)).concat(getArrowMeasurementData(arrowMeasurementContent, displaySets));
    }
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
