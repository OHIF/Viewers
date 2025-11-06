import { DicomDict } from 'dcmjs';
import { denaturalizeDataset } from 'dcmjs';
import { EXPLICIT_VR_LITTLE_ENDIAN, ImplementationClassUID, ImplementationVersionName } from './constants';
import type { XNATDataSourceConfigManager } from './config';

/**
 * Store methods for XNATDataSource
 */
export class XNATStoreMethods {
    private configManager: XNATDataSourceConfigManager;

    constructor(configManager: XNATDataSourceConfigManager) {
        this.configManager = configManager;
    }

    /**
     * Store DICOM instances
     */
    async dicom(dataset: any, request: any, dicomDict?: any) {
        this.configManager.getWadoClient().headers = this.configManager.getAuthorizationHeader();

        if (dataset instanceof ArrayBuffer) {
            const options = {
                datasets: [dataset],
                request,
            };
            await this.configManager.getWadoClient().storeInstances(options);
        } else {
            let effectiveDicomDict = dicomDict;

            if (!dicomDict) {
                const meta = {
                    FileMetaInformationVersion: dataset._meta?.FileMetaInformationVersion?.Value,
                    MediaStorageSOPClassUID: dataset.SOPClassUID,
                    MediaStorageSOPInstanceUID: dataset.SOPInstanceUID,
                    TransferSyntaxUID: EXPLICIT_VR_LITTLE_ENDIAN,
                    ImplementationClassUID,
                    ImplementationVersionName,
                };

                const denaturalized = denaturalizeDataset(meta);
                const defaultDicomDict = new DicomDict(denaturalized);
                defaultDicomDict.dict = denaturalizeDataset(dataset);

                effectiveDicomDict = defaultDicomDict;
            }

            const part10Buffer = effectiveDicomDict.write();

            const options = {
                datasets: [part10Buffer],
                request,
            };

            await this.configManager.getWadoClient().storeInstances(options);
        }
    }
}
