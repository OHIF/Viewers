import { OHIF } from 'meteor/ohif:core';
import { remoteGetValue } from '../../lib/remoteGetValue';
import { parseFloatArray } from '../../lib/parseFloatArray';

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
    var SourceImageSequence = remoteGetValue(instance['0008,2112']);
    if (SourceImageSequence && SourceImageSequence.Value && SourceImageSequence.Value.length) {
        return SourceImageSequence.Value[0]['0008,1155'].Value[0];
    }
}

/**
 * Parses result data from a WADO search into Study MetaData
 * Returns an object populated with study metadata, including the
 * series list.
 *
 * @param server
 * @param studyInstanceUid
 * @param resultData
 * @returns {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */
function resultDataToStudyMetadata(server, studyInstanceUid, resultData) {
    var seriesMap = {};
    var seriesList = [];

    if (!resultData.length) {
        return;
    }

    var anInstance = resultData[0];
    if (!anInstance) {
        return;
    }

    var studyData = {
        seriesList: seriesList,
        patientName: remoteGetValue(anInstance['0010,0010']),
        patientId: remoteGetValue(anInstance['0010,0020']),
        accessionNumber: remoteGetValue(anInstance['0008,0050']),
        studyDate: remoteGetValue(anInstance['0008,0020']),
        modalities: remoteGetValue(anInstance['0008,0061']),
        studyDescription: remoteGetValue(anInstance['0008,1030']),
        imageCount: remoteGetValue(anInstance['0020,1208']),
        studyInstanceUid: remoteGetValue(anInstance['0020,000d'])
    };

    resultData.forEach(function(instance) {
        var seriesInstanceUid = remoteGetValue(instance['0020,000e']);
        var series = seriesMap[seriesInstanceUid];
        if (!series) {
            series = {
                seriesDescription: remoteGetValue(instance['0008,103e']),
                modality: remoteGetValue(instance['0008,0060']),
                seriesInstanceUid: seriesInstanceUid,
                seriesNumber: parseFloat(remoteGetValue(instance['0020,0011'])),
                instances: []
            };
            seriesMap[seriesInstanceUid] = series;
            seriesList.push(series);
        }

        var sopInstanceUid = remoteGetValue(instance['0008,0018']);

        var instanceSummary = {
            imageType: remoteGetValue(instance['0008,0008']),
            sopClassUid: remoteGetValue(instance['0008,0016']),
            sopInstanceUid: sopInstanceUid,
            instanceNumber: parseFloat(remoteGetValue(instance['0020,0013'])),
            imagePositionPatient: remoteGetValue(instance['0020,0032']),
            imageOrientationPatient: remoteGetValue(instance['0020,0037']),
            frameOfReferenceUID: remoteGetValue(instance['0020,0052']),
            sliceLocation: parseFloat(remoteGetValue(instance['0020,1041'])),
            samplesPerPixel: parseFloat(remoteGetValue(instance['0028,0002'])),
            photometricInterpretation: remoteGetValue(instance['0028,0004']),
            rows: parseFloat(remoteGetValue(instance['0028,0010'])),
            columns: parseFloat(remoteGetValue(instance['0028,0011'])),
            pixelSpacing: remoteGetValue(instance['0028,0030']),
            bitsAllocated: parseFloat(remoteGetValue(instance['0028,0100'])),
            bitsStored: parseFloat(remoteGetValue(instance['0028,0101'])),
            highBit: parseFloat(remoteGetValue(instance['0028,0102'])),
            pixelRepresentation: parseFloat(remoteGetValue(instance['0028,0103'])),
            windowCenter: remoteGetValue(instance['0028,1050']),
            windowWidth: remoteGetValue(instance['0028,1051']),
            rescaleIntercept: parseFloat(remoteGetValue(instance['0028,1052'])),
            rescaleSlope: parseFloat(remoteGetValue(instance['0028,1053'])),
            sourceImageInstanceUid: getSourceImageInstanceUid(instance),
            laterality: remoteGetValue(instance['0020,0062']),
            viewPosition: remoteGetValue(instance['0018,5101']),
            acquisitionDateTime: remoteGetValue(instance['0008,002A']),
            numberOfFrames: parseFloat(remoteGetValue(instance['0028,0008'])),
            frameIncrementPointer: remoteGetValue(instance['0028,0009']),
            frameTime: parseFloat(remoteGetValue(instance['0018,1063'])),
            frameTimeVector: parseFloatArray(remoteGetValue(instance['0018,1065'])),
            echoNumber: remoteGetValue(instance['0018,0086']),
            contrastBolusAgent: remoteGetValue(instance['0018,0010'])
        };

        var iid = instance['xxxx,0001'].Value;
        if (server.imageRendering === 'wadouri') {
            instanceSummary.wadouri = server.wadoUriRoot + '?requestType=WADO&studyUID=' + studyInstanceUid + '&seriesUID=' + seriesInstanceUid + '&objectUID=' + sopInstanceUid + "&contentType=application%2Fdicom";
        } else if (server.imageRendering == 'orthanc') {
            instanceSummary.wadouri = server.root + '/instances/' + iid + '/file';
        } else {
            instanceSummary.wadorsuri = server.wadoRoot + '/studies/' + studyInstanceUid + '/series/' + seriesInstanceUid + '/instances/' + sopInstanceUid + '/frames/1';
        }

        series.instances.push(instanceSummary);
    });
console.log(studyData.seriesList[0].instances);
    return studyData;
}

/**
 * Retrieved Study MetaData from a DICOM server using a WADO call
 * @param server
 * @param studyInstanceUid
 * @returns {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */
OHIF.studies.services.REMOTE.RetrieveMetadata = function(server, studyInstanceUid) {
    var remote = new OrthancRemote(server.root, server.sourceAE);

    var study = resultDataToStudyMetadata(server, studyInstanceUid, remote.retrieveMetadata(server.modality, studyInstanceUid));
    if (!study) {
       study = {};
    }

    study.wadoUriRoot = server.wadoUriRoot;
    study.studyInstanceUid = studyInstanceUid;

    return study;
};
