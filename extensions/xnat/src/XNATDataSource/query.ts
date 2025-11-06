import {
    mapParams,
    search as qidoSearch,
    seriesInStudy,
    processResults,
    processSeriesResults,
} from './qido';
import { getXNATStatusFromStudyInstanceUID } from './Utils/DataSourceUtils';
import { generateRandomUID } from './Utils/UIDUtils';

/**
 * Query methods for XNATDataSource
 */
export class XNATQueryMethods {
    private config: any;
    private qidoClient: any;
    private getAuthorizationHeader: () => any;
    private xnatApi: any;

    constructor(config: any, qidoClient: any, getAuthorizationHeader: () => any, xnatApi: any) {
        this.config = config;
        this.qidoClient = qidoClient;
        this.getAuthorizationHeader = getAuthorizationHeader;
        this.xnatApi = xnatApi;
    }

    /**
     * Query methods for studies
     */
    get studies() {
        return {
            mapParams: mapParams.bind({}), // Consider if mapParams needs config

            search: async (origParams: any) => {
                let studyInstanceUid = origParams?.studyInstanceUID || origParams?.StudyInstanceUID;
                if (!studyInstanceUid && typeof origParams === 'object' && origParams !== null) {
                    if (origParams.studyInstanceUid) {
                        studyInstanceUid = origParams.studyInstanceUid;
                    }
                }

                const { projectId, experimentId } = getXNATStatusFromStudyInstanceUID(studyInstanceUid, this.config);

                if (!projectId || !experimentId) {
                    console.error('XNAT: Missing projectId or experimentId for metadata fetch in search');
                    console.error('XNAT: Please provide these values in URL parameters or configuration');
                    // Fallback to DICOMweb search if XNAT specific identifiers are missing
                } else {
                    try {
                        const xnatMetadata = await this.xnatApi.getExperimentMetadata(projectId, experimentId);

                        if (!xnatMetadata || !xnatMetadata.studies || !xnatMetadata.studies.length) {
                            console.error('XNAT: No valid metadata returned from XNAT API in search');
                            return [];
                        }

                        const results = [];
                        xnatMetadata.studies.forEach((study: any) => {
                            const result: any = {
                                "00080020": { vr: "DA", Value: [study.StudyDate || ""] },
                                "00080030": { vr: "TM", Value: [study.StudyTime || ""] },
                                "00080050": { vr: "SH", Value: [study.AccessionNumber || ""] },
                                "00080054": { vr: "AE", Value: [this.config.qidoRoot || ""] },
                                "00080056": { vr: "CS", Value: ["ONLINE"] },
                                "00080061": { vr: "CS", Value: study.ModalitiesInStudy || study.Modalities || (study.series && study.series.length > 0 ? Array.from(new Set(study.series.map((s: any) => s.Modality).filter(Boolean))) : ["UNKNOWN"]) },
                                "00080090": { vr: "PN", Value: [{ Alphabetic: study.ReferringPhysicianName || "" }] },
                                "00081190": { vr: "UR", Value: [this.config.qidoRoot || ""] },
                                "00100010": { vr: "PN", Value: [{ Alphabetic: study.PatientName || "Anonymous" }] },
                                "00100020": { vr: "LO", Value: [study.PatientID || ""] },
                                "00100030": { vr: "DA", Value: [study.PatientBirthDate || ""] },
                                "00100040": { vr: "CS", Value: [study.PatientSex || ""] },
                                "0020000D": { vr: "UI", Value: [studyInstanceUid || study.StudyInstanceUID || xnatMetadata.transactionId || generateRandomUID()] },
                                "00200010": { vr: "SH", Value: [study.StudyID || ""] },
                                "00081030": { vr: "LO", Value: [study.StudyDescription || "XNAT Study"] }
                            };
                            if (study.series && study.series.length) {
                                result["00201206"] = { vr: "IS", Value: [study.series.length.toString()] };
                            }
                            results.push(result);
                        });
                        return results;
                    } catch (error) {
                        console.error('XNAT: Error in XNAT-specific study search:', error);
                        // Fall through to DICOMweb search on error
                    }
                }

                // Fallback to traditional DICOMweb search
                console.warn('XNAT: Falling back to DICOMweb search for studies.');
                if (!this.qidoClient) {
                    console.error('qidoDicomWebClient not available - DICOMweb search will fail');
                    return [];
                }
                this.qidoClient.headers = this.getAuthorizationHeader();
                const validOrigParams = typeof origParams === 'object' && origParams !== null ? origParams : {};
                const mappedResult = mapParams(validOrigParams, {
                    supportsFuzzyMatching: this.config.supportsFuzzyMatching,
                    supportsWildcard: this.config.supportsWildcard,
                });
                const paramMap: Record<string, any> = typeof mappedResult === 'object' && mappedResult !== null ? mappedResult : {};
                const queryStudyInstanceUid = paramMap.studyInstanceUID || origParams?.studyInstanceUID || origParams?.StudyInstanceUID;
                const querySeriesInstanceUid = paramMap.seriesInstanceUID;
                delete paramMap.studyInstanceUID;
                delete paramMap.seriesInstanceUID;
                const dicomWebResults = await qidoSearch(this.qidoClient, queryStudyInstanceUid, querySeriesInstanceUid, paramMap);
                return processResults(dicomWebResults);
            },

            processResults: processResults,
        };
    }

    /**
     * Query methods for series
     */
    get series() {
        return {
            search: async (studyInstanceUID: any, filters?: any) => {
                if (!this.qidoClient) {
                    console.error('qidoDicomWebClient not available - series search may fail');
                    return [];
                }
                this.qidoClient.headers = this.getAuthorizationHeader();

                let currentStudyInstanceUID = studyInstanceUID;
                if (typeof studyInstanceUID === 'object' && studyInstanceUID !== null) {
                    currentStudyInstanceUID = studyInstanceUID.StudyInstanceUID || studyInstanceUID.studyInstanceUID;
                }
                if (typeof currentStudyInstanceUID !== 'string') {
                    console.error('XNAT series search: Unable to determine studyInstanceUID from', studyInstanceUID);
                    return [];
                }
                try {
                    const results = await seriesInStudy(this.qidoClient, currentStudyInstanceUID);
                    return processSeriesResults(results);
                } catch (error) {
                    console.error('XNAT series search error:', error);
                    return [];
                }
            },
        };
    }

    /**
     * Query methods for instances
     */
    get instances() {
        return {
            search: (studyInstanceUid: string, seriesInstanceUid: string, queryParameters?: any) => {
                this.qidoClient.headers = this.getAuthorizationHeader();
                return qidoSearch.call(
                    undefined,
                    this.qidoClient,
                    studyInstanceUid,
                    seriesInstanceUid, // Pass seriesInstanceUid
                    queryParameters
                );
            },
        };
    }
}