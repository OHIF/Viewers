import { convertMeasurementsToSR } from './convertMeasurementsToSR';
import { convertSRToMeasurements } from './convertSRToMeasurements';
import {
    getAllSRSeries,
    getLatestSRSeries,
    multipartEncode,
    getWADOProxyUrl
} from './srUtilities';

const retrieveMeasurementFromSR = (srSeries) => {
    const instance = srSeries.getFirstInstance();

    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        request.responseType = 'arraybuffer';
        request.open('GET', instance.getDataProperty('wadouri'));

        request.onload = function (progressEvent) {
            const measurements = convertSRToMeasurements(progressEvent.currentTarget.response);

            resolve(measurements);
        };

        request.onerror = function(error) {
            reject(error);
        };

        request.send();
    });
};

const stowSRFromMeasurements = (measurements) => {
    const wadoProxyURL = getWADOProxyUrl();
    const reportDataset = convertMeasurementsToSR(measurements);
    const boundary = dcmjs.data.DicomMetaDictionary.uid();
    const multipartBuffer = multipartEncode(reportDataset, boundary);
    
    console.log(reportDataset);
    
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", wadoProxyURL);
        request.onload = (resp) => {
            console.log('STOWSR resp: ', resp);
            resolve();
        };
        
        request.onerror = (error) => {
            console.log('STOWSR error: ', error);
            reject();
        }
        
        request.setRequestHeader(
            'Content-Type',
            `multipart/related; type=application/dicom; boundary=${boundary}`
        );
        
        request.send(multipartBuffer);
    });
};

export {
    convertMeasurementsToSR,
    convertSRToMeasurements,
    getAllSRSeries,
    getLatestSRSeries,
    retrieveMeasurementFromSR,
    stowSRFromMeasurements
}
