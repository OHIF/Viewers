import { dcmjs } from 'meteor/ohif:cornerstone';
import retrieveDataFromSR from './retrieveDataFromSR';
import retrieveDataFromMeasurements from './retrieveDataFromMeasurements';
import Request from './request';
import {
    multipartEncode
} from './srUtils';

const retrieveMeasurementFromSR = async (series) => {
    const instance = series.getFirstInstance();
    const options  = {
        method: 'GET',
        url: instance.getDataProperty('wadouri'),
        responseType: 'arraybuffer',
    };

    try {
        const result = await Request(options);
        const measurementData = retrieveDataFromSR(result);
        return Promise.resolve(measurementData);
    } catch(error) {
        return Promise.reject(error);
    }
};

const stowSRFromMeasurements = async (measurements) => {
    const wadoProxyURL = OHIF.servers.getWADOProxyUrl();
    const reportDataset = retrieveDataFromMeasurements(measurements);
    const boundary = dcmjs.data.DicomMetaDictionary.uid();
    const options = {
        method: 'POST',
        url: wadoProxyURL,
        body: multipartEncode(reportDataset, boundary),
        headers: {
            'Content-Type': `multipart/related; type=application/dicom; boundary=${boundary}`
        }
    };
    
    try {
        await Request(options);
        return Promise.resolve();
    } catch(error) {
        return Promise.reject(error);
    }
};

export {
    retrieveMeasurementFromSR,
    stowSRFromMeasurements
}
