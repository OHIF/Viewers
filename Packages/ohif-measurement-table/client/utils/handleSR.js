import { dcmjs } from 'meteor/ohif:cornerstone';
import retrieveDataFromSR from './retrieveDataFromSR';
import retrieveDataFromMeasurements from './retrieveDataFromMeasurements';

import DICOMwebClient from 'dicomweb-client';

const retrieveMeasurementFromSR = async (series) => {
    const server = OHIF.servers.getCurrentServer();
    const url = WADOProxy.convertURL(server.wadoRoot, server);

    const config = {
        url,
        headers: OHIF.DICOMWeb.getAuthorizationHeader()
    };

    const dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);

    const instance = series.getFirstInstance();
    const options = {
        studyInstanceUID: instance.getStudyInstanceUID(),
        seriesInstanceUID: instance.getSeriesInstanceUID(),
        sopInstanceUID: instance.getSOPInstanceUID(),
    };

    return dicomWeb.retrieveInstance(options).then(retrieveDataFromSR);
};

const stowSRFromMeasurements = async (measurements) => {
    const server = OHIF.servers.getCurrentServer();
    const url = WADOProxy.convertURL(server.wadoRoot, server);
    const dataset = retrieveDataFromMeasurements(measurements);
    const { DicomMetaDictionary, DicomDict } = dcmjs.data;

    const meta = {
        FileMetaInformationVersion: dataset._meta.FileMetaInformationVersion.Value,
        MediaStorageSOPClassUID: dataset.SOPClassUID,
        MediaStorageSOPInstanceUID: dataset.SOPInstanceUID,
        TransferSyntaxUID: "1.2.840.10008.1.2.1",
        ImplementationClassUID: DicomMetaDictionary.uid(),
        ImplementationVersionName: "dcmjs-0.0",
    };

    const denaturalized = DicomMetaDictionary.denaturalizeDataset(meta);
    const dicomDict = new DicomDict(denaturalized);

    dicomDict.dict = DicomMetaDictionary.denaturalizeDataset(dataset);

    const part10Buffer = dicomDict.write();

    const config = {
        url,
        headers: OHIF.DICOMWeb.getAuthorizationHeader()
    };

    const dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
    const options = {
        datasets: [part10Buffer]
    };

    return dicomWeb.storeInstances(options);
};

export {
    retrieveMeasurementFromSR,
    stowSRFromMeasurements
}
