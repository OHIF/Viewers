import { OHIF } from 'meteor/ohif:core';
import { parseFloatArray } from 'meteor/ohif:studies/imports/both/lib/parseFloatArray';
import DIMSE from 'dimse';

/**
 * Returns the value of the element (e.g. '00280009')
 *
 * @param element - The group/element of the element (e.g. '00280009')
 * @param defaultValue - The default value to return if the element does not exist
 * @returns {*}
 */
function getValue(element, defaultValue) {
    if (!element || !element.value) {
        return defaultValue;
    }

    return element.value;
}

/**
 * Parses the SourceImageSequence, if it exists, in order
 * to return a ReferenceSOPInstanceUID. The ReferenceSOPInstanceUID
 * is used to refer to this image in any accompanying DICOM-SR documents.
 *
 * @param instance
 * @returns {String} The ReferenceSOPInstanceUID
 */
function getSourceImageInstanceUid(instance) {
    // TODO= Parse the whole Source Image Sequence
    // This is a really poor workaround for now.
    // Later we should probably parse the whole sequence.
    const SourceImageSequence = instance[0x00082112];
    if (SourceImageSequence && SourceImageSequence.length) {
        return SourceImageSequence[0][0x00081155];
    }
}

/**
 * Parses result data from a DIMSE search into Study MetaData
 * Returns an object populated with study metadata, including the
 * series list.
 *
 * @param studyInstanceUid
 * @param resultData
 * @returns {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */
function resultDataToStudyMetadata(studyInstanceUid, resultData) {
    OHIF.log.info('resultDataToStudyMetadata');
    const seriesMap = {};
    const seriesList = [];

    if (!resultData.length) {
        return;
    }

    const anInstance = resultData[0].toObject();
    if (!anInstance) {
        return;
    }

    const studyData = {
        seriesList: seriesList,
        patientName: anInstance[0x00100010],
        patientId: anInstance[0x00100020],
        patientBirthDate: anInstance[0x00100030],
        patientSex: anInstance[0x00100040],
        accessionNumber: anInstance[0x00080050],
        studyDate: anInstance[0x00080020],
        modalities: anInstance[0x00080061],
        studyDescription: anInstance[0x00081030],
        imageCount: anInstance[0x00201208],
        studyInstanceUid: anInstance[0x0020000D],
        institutionName: anInstance[0x00080080]
    };

    resultData.forEach(function(instanceRaw) {
        const instance = instanceRaw.toObject();
        const seriesInstanceUid = instance[0x0020000E];
        let series = seriesMap[seriesInstanceUid];
        if (!series) {
            series = {
                seriesDescription: instance[0x0008103E],
                modality: instance[0x00080060],
                seriesInstanceUid: seriesInstanceUid,
                seriesNumber: parseFloat(instance[0x00200011]),
                instances: []
            };
            seriesMap[seriesInstanceUid] = series;
            seriesList.push(series);
        }

        const sopInstanceUid = instance[0x00080018];

        const instanceSummary = {
            imageType: instance[0x00080008],
            sopClassUid: instance[0x00080016],
            modality: instance[0x00080060],
            sopInstanceUid: sopInstanceUid,
            instanceNumber: parseFloat(instance[0x00200013]),
            imagePositionPatient: instance[0x00200032],
            imageOrientationPatient: instance[0x00200037],
            frameOfReferenceUID: instance[0x00200052],
            sliceThickness: parseFloat(instance[0x00180050]),
            sliceLocation: parseFloat(instance[0x00201041]),
            tablePosition: parseFloat(instance[0x00189327]),
            samplesPerPixel: parseFloat(instance[0x00280002]),
            photometricInterpretation: instance[0x00280004],
            planarConfiguration: parseFloat(instance[0x00280006]),
            rows: parseFloat(instance[0x00280010]),
            columns: parseFloat(instance[0x00280011]),
            pixelSpacing: instance[0x00280030],
            bitsAllocated: parseFloat(instance[0x00280100]),
            bitsStored: parseFloat(instance[0x00280101]),
            highBit: parseFloat(instance[0x00280102]),
            pixelRepresentation: parseFloat(instance[0x00280103]),
            windowCenter: instance[0x00281050],
            windowWidth: instance[0x00281051],
            rescaleIntercept: parseFloat(instance[0x00281052]),
            rescaleSlope: parseFloat(instance[0x00281053]),
            sourceImageInstanceUid: getSourceImageInstanceUid(instance),
            laterality: instance[0x00200062],
            viewPosition: instance[0x00185101],
            acquisitionDateTime: instance[0x0008002A],
            numberOfFrames: parseFloat(instance[0x00280008]),
            frameIncrementPointer: getValue(instance[0x00280009]),
            frameTime: parseFloat(instance[0x00181063]),
            frameTimeVector: parseFloatArray(instance[0x00181065]),
            lossyImageCompression: instance[0x00282110],
            derivationDescription: instance[0x00282111],
            lossyImageCompressionRatio: instance[0x00282112],
            lossyImageCompressionMethod: instance[0x00282114],
            spacingBetweenSlices: instance[0x00180088],
            echoNumber: instance[0x00180086],
            contrastBolusAgent: instance[0x00180010]
        };

        // Retrieve the actual data over WADO-URI
        const server = OHIF.servers.getCurrentServer();
        const wadouri = `${server.wadoUriRoot}?requestType=WADO&studyUID=${studyInstanceUid}&seriesUID=${seriesInstanceUid}&objectUID=${sopInstanceUid}&contentType=application%2Fdicom`;
        instanceSummary.wadouri = WADOProxy.convertURL(wadouri, server);

        series.instances.push(instanceSummary);
    });

    studyData.studyInstanceUid = studyInstanceUid;

    return studyData;
}

/**
 * Retrieved Study MetaData from a DICOM server using DIMSE
 * @param studyInstanceUid
 * @returns {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */
OHIF.studies.services.DIMSE.RetrieveMetadata = function(studyInstanceUid) {
    // TODO: Check which peer it should point to
    const activeServer = OHIF.servers.getCurrentServer().peers[0];
    const supportsInstanceRetrievalByStudyUid = activeServer.supportsInstanceRetrievalByStudyUid;
    let results;

    // Check explicitly for a value of false, since this property
    // may be left undefined in config files
    if (supportsInstanceRetrievalByStudyUid === false) {
        results = DIMSE.retrieveInstancesByStudyOnly(studyInstanceUid);
    } else {
        results = DIMSE.retrieveInstances(studyInstanceUid);
    }

    return resultDataToStudyMetadata(studyInstanceUid, results);
};
