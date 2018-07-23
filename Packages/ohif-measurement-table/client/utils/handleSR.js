import { dcmjs } from 'meteor/ohif:cornerstone';
import retrieveDataFromSR from './retrieveDataFromSR';
import retrieveDataFromMeasurements from './retrieveDataFromMeasurements';
import {
    multipartEncode,
    getWADOProxyUrl
} from './srUtils';

const retrieveMeasurementFromSR = (series) => {
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

const stowSRFromMeasurements = (measurements) => {
    const wadoProxyURL = getWADOProxyUrl();
    const reportDataset = retrieveDataFromMeasurements(measurements);
    const boundary = dcmjs.data.DicomMetaDictionary.uid();
    const multipartBuffer = multipartEncode(reportDataset, boundary);
    
    console.log(reportDataset);
    
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", wadoProxyURL);
        request.onload = () => {
            resolve();
        };
        
        request.onerror = () => {
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
    retrieveMeasurementFromSR,
    stowSRFromMeasurements
}
