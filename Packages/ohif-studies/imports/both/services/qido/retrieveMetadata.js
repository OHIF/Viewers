
import { OHIF } from 'meteor/ohif:core';
import DICOMwebClient from 'dicomweb-client';
const { DICOMWeb } = OHIF;

/**
 * Creates a URL for a WADO search
 *
 * @param server
 * @param studyInstanceUid
 * @returns {string}
 */
function buildUrl(server, studyInstanceUid) {
    return server.wadoRoot + '/studies?includefield=all&StudyInstanceUID=' + studyInstanceUid;
}

function buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid) {
    return `${server.wadoRoot}/studies/${studyInstanceUid}/series/${seriesInstanceUid}/instances/${sopInstanceUid}`
}

function buildInstanceFrameWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid, frame) {
    const baseWadoRsUri = buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
    frame = frame != null || 1;

    return `${baseWadoRsUri}/frames/${frame}`
}
/**
 * Parses result data from a QIDO search into Study MetaData
 * Returns an object populated with study metadata, including the
 * series list.
 *
 * @param server
 * @param studyInstanceUid
 * @param resultData
 * @returns {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */
async function resultDataToStudyMetadata(server, studyInstanceUid, resultData, instancesIn) {

    const seriesList = [];

    if (!resultData.length) {
        return;
    }

    const anInstance = resultData[0];
    if (!anInstance) {
        return;
    }

    const studyData = {
        seriesList,
        patientName: DICOMWeb.getName(anInstance['00100010']),
        patientId: DICOMWeb.getString(anInstance['00100020']),
        patientAge: DICOMWeb.getNumber(anInstance['00101010']),
        patientSize: DICOMWeb.getNumber(anInstance['00101020']),
        patientWeight: DICOMWeb.getNumber(anInstance['00101030']),
        accessionNumber: DICOMWeb.getString(anInstance['00080050']),
        studyDate: DICOMWeb.getString(anInstance['00080020']),
        modalities: DICOMWeb.getString(anInstance['00080061']),
        studyDescription: DICOMWeb.getString(anInstance['00081030']),
        imageCount: DICOMWeb.getString(anInstance['00201208']),
        studyInstanceUid: DICOMWeb.getString(anInstance['0020000D']),
        institutionName: DICOMWeb.getString(anInstance['00080080'])
    };
    await Promise.all(instancesIn.seriesList.map(async function(seriesMap) {
        var instance = seriesMap.instances[0];
        var seriesInstanceUid = instance.seriesInstanceUid;
        var series = seriesMap[seriesInstanceUid];
        if (!series) {
            series = seriesMap;
            series.instances = [];
            seriesMap[seriesInstanceUid] = series;
            seriesList.push(series);
        }
        const sopInstanceUid = instance.sopInstanceUid;
        const wadouri = buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
        const baseWadoRsUri = buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
        const wadorsuri = buildInstanceFrameWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);

        const instanceSummary = instance;
        instanceSummary.baseWadoRsUri=baseWadoRsUri;
        instanceSummary.wadouri=WADOProxy.convertURL(wadouri, server);
        instanceSummary.wadorsuri=WADOProxy.convertURL(wadorsuri, server);
        instanceSummary.imageRendering=server.imageRendering;
        instanceSummary.thumbnailRendering=server.thumbnailRendering;
        series.instances.push(instanceSummary);
    }));
    return studyData;
}

/**
 * Retrieved Study MetaData from a DICOM server using a WADO call
 * @param server
 * @param studyInstanceUid
 * @returns {Promise}
 */
OHIF.studies.services.QIDO.RetrieveMetadata = async function(server, studyInstanceUid) {
    const url = buildUrl(server, studyInstanceUid);
    return new Promise((resolve, reject) => {
        DICOMWeb.getJSON(url, server.requestOptions).then(result => {
            OHIF.studies.services.QIDO.Instances(server, studyInstanceUid).then(instances => {
                resultDataToStudyMetadata(server, studyInstanceUid, result, instances).then((study) => {
                    study.wadoUriRoot = server.wadoUriRoot;
                    study.studyInstanceUid = studyInstanceUid;
                    resolve(study);
                }, reject)
            }, reject);
        }, reject);
    });
};
