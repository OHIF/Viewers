import { dcmjs } from 'meteor/ohif:cornerstone';
import retrieveDataFromSR from './retrieveDataFromSR';
import retrieveDataFromMeasurements from './retrieveDataFromMeasurements';
import {
    multipartEncode
} from './srUtils';

const retrieveMeasurementFromSR = async (series) => {
    const instance = series.getFirstInstance();
    const options  = {
        method: 'GET',
        responseType: 'arraybuffer',
    };
    const url = instance.getDataProperty('wadouri');

    try {
        const result = await DICOMWeb.makeRequest(url, options);
        const data = await result.arrayBuffer();
        const measurementData = retrieveDataFromSR(data);
        return Promise.resolve(measurementData);
    } catch(error) {
        return Promise.reject(error);
    }
};

/**
 * Retrieve the DICOMWeb STOW-RS URL for the current server.
 *
 * See ftp://medical.nema.org/medical/dicom/current/output/html/part18.html#sect_6.6.1.1
 *
 * @return {string|null} The URL, rerouted to the proxy if the WADOProxy is enabled.
 */
function getStowRsUrl() {
    const server = OHIF.servers.getCurrentServer();
    const url = `${server.wadoRoot}/studies`;

    return WADOProxy.convertURL(url, server);
}

const stowSRFromMeasurements = async (measurements) => {
    const serverUrl = getStowRsUrl();
    const reportDataset = retrieveDataFromMeasurements(measurements);
    const boundary = dcmjs.data.DicomMetaDictionary.uid();
    const options = {
        method: 'POST',
        body: multipartEncode(reportDataset, boundary),
        headers: {
            'Content-Type': `multipart/related; type=application/dicom; boundary=${boundary}`
        }
    };

    try {
        await DICOMWeb.makeRequest(serverUrl, options);
        return Promise.resolve();
    } catch(error) {
        return Promise.reject(error);
    }
};

export {
    retrieveMeasurementFromSR,
    stowSRFromMeasurements
}
