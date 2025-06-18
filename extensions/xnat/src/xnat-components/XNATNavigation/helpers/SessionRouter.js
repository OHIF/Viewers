import checkSessionJSONExists from './checkSessionJSONExists';
import fetchJSON from '../../../utils/IO/fetchJSON';
import sessionMap from '../../../utils/sessionMap';
import { DicomMetadataStore } from '@ohif/core';
//import progressDialog from '../../../../lib/dialogUtils/progressDialog.js';

export default class SessionRouter {
    constructor(
        projectId,
        parentProjectId,
        subjectId,
        experimentId,
        experimentLabel
    ) {
        this.projectId = projectId;
        this.parentProjectId = parentProjectId;
        this.subjectId = subjectId;
        this.experimentId = experimentId;
        this.experimentLabel = experimentLabel;

        // Set the root URL to the current origin
        sessionMap.xnatRootUrl = window.location.origin + '/';

        // Store reference to DicomMetadataStore from import
        this.dicomMetadataStore = DicomMetadataStore;
    }

    go() {
        // Ensure we have valid strings for our parameters
        const projectId = this.projectId ? String(this.projectId) : '';
        const experimentId = this.experimentId ? String(this.experimentId) : '';
        const subjectId = this.subjectId ? String(this.subjectId) : '';

        console.log('SessionRouter.go() called with validated params:', {
            projectId,
            subjectId,
            experimentId
        });

        // Store these in sessionStorage for recovery if needed
        try {
            sessionStorage.setItem('xnat_projectId', projectId);
            sessionStorage.setItem('xnat_experimentId', experimentId);
            sessionStorage.setItem('xnat_subjectId', subjectId);
            console.log('Stored XNAT session parameters in sessionStorage');
        } catch (e) {
            console.warn('Failed to store XNAT parameters in sessionStorage:', e);
        }

        if (!projectId || !experimentId) {
            console.error('Missing required parameters for SessionRouter');
            return Promise.reject(new Error('Missing required projectId or experimentId parameters'));
        }

        try {
            const url = `/data/projects/${projectId}/experiments/${experimentId}?format=json`;
            console.log('SessionRouter fetching session data from:', url);

            // Fetch the experiment data from XNAT API with less specific Accept header
            return fetch(url, {
                    credentials: 'include', // Ensure cookies are sent
                    headers: {
                        // Use a more permissive Accept header that the server will accept
                        'Accept': '*/*'
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`XNAT API request failed: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('SessionRouter: Received data from XNAT API', data);

                    // Extract study instance UID from the data
                    if (!data || !data.items || !data.items[0] || !data.items[0].data_fields) {
                        throw new Error('Invalid session data structure from XNAT API');
                    }

                    const sessionData = data.items[0].data_fields;
                    const studyInstanceUID = sessionData.UID;

                    if (!studyInstanceUID) {
                        throw new Error('Study Instance UID not found in session data');
                    }

                    console.log('SessionRouter: Extracted studyInstanceUID:', studyInstanceUID);

                    // Store the studyInstanceUID in sessionStorage for recovery
                    try {
                        sessionStorage.setItem('xnat_studyInstanceUID', studyInstanceUID);

                        // Also store study date and time if available in the session data
                        if (sessionData.date) {
                            sessionStorage.setItem('xnat_studyDate', sessionData.date);
                            console.log('Stored study date in sessionStorage:', sessionData.date);
                        }

                        if (sessionData.time) {
                            sessionStorage.setItem('xnat_studyTime', sessionData.time);
                            console.log('Stored study time in sessionStorage:', sessionData.time);
                        } else if (sessionData.insert_date) {
                            // Try to extract time from insert_date if time is not available
                            const timeMatch = sessionData.insert_date.match(/\d{2}:\d{2}:\d{2}/);
                            if (timeMatch) {
                                const formattedTime = timeMatch[0].replace(/:/g, '');
                                sessionStorage.setItem('xnat_studyTime', formattedTime);
                                console.log('Stored study time from insert_date in sessionStorage:', formattedTime);
                            }
                        }

                        console.log('Stored studyInstanceUID in sessionStorage');
                    } catch (e) {
                        console.warn('Failed to store studyInstanceUID in sessionStorage:', e);
                    }

                    // Add the study to DicomMetadataStore if needed
                    const DicomMetadataStore = this.dicomMetadataStore || window.DicomMetadataStore;
                    if (DicomMetadataStore) {
                        try {
                            // Check if study already exists in store
                            const existingStudy = DicomMetadataStore.getStudy(studyInstanceUID);
                            if (!existingStudy) {
                                // Create a minimal study entry that will be populated later
                                DicomMetadataStore.addStudy({
                                    StudyInstanceUID: studyInstanceUID,
                                    PatientID: sessionData.subject_ID || subjectId,
                                    PatientName: sessionData.dcmPatientName || subjectId,
                                    StudyDate: sessionData.date || '',
                                    StudyTime: '',
                                    AccessionNumber: experimentId,
                                    StudyID: sessionData.study_id || experimentId,
                                    StudyDescription: sessionData.label || '',
                                    NumInstances: 0 // Will be updated when series are loaded
                                });
                                console.log('SessionRouter: Added study to DicomMetadataStore:', studyInstanceUID);
                            }
                        } catch (e) {
                            console.warn('Error adding study to DicomMetadataStore:', e);
                        }
                    }

                    // Set up DICOM web data source for this study
                    this._setupDicomWebDataSource(studyInstanceUID);

                    // Dispatch a custom event to notify that XNAT session is ready
                    // This helps coordinate the data source and router
                    try {
                        const event = new CustomEvent('xnatSessionReady', {
                            detail: {
                                projectId,
                                experimentId,
                                subjectId,
                                studyInstanceUID
                            }
                        });
                        window.dispatchEvent(event);
                        console.log('Dispatched xnatSessionReady event');
                    } catch (e) {
                        console.warn('Failed to dispatch xnatSessionReady event:', e);
                    }

                    // Return the study instance UID
                    return studyInstanceUID;
                })
                .catch(error => {
                    console.error('SessionRouter fetch error:', error);
                    throw error;
                });
        } catch (error) {
            console.error('SessionRouter setup error:', error);
            return Promise.reject(error);
        }
    }

    _checkJSONandloadRoute() {
        checkSessionJSONExists(this.projectId, this.subjectId, this.experimentId)
            .then(result => {
                if (result === true) {
                    this._loadRoute();
                } else {
                    this._generateSessionMetadata();
                }
            })
            .catch(err => console.log(err));
    }

    _generateSessionMetadata() {
        // Generate metadata
        // progressDialog.show({
        //   notificationText: `generating metadata for ${this.experimentLabel}...`,
        // });

        fetchJSON(
                `/xapi/viewer/projects/${this.projectId}/experiments/${this.experimentId}`
            )
            .promise.then(result => {
                console.log('SessionRouter: Generated session metadata:', result);
                if (result) {
                    this._loadRoute();
                } else {
                    //progressDialog.close();
                }
            })
            .catch(err => console.log(err));
    }

    _loadRoute() {
        let params = `?subjectId=${this.subjectId}&projectId=${this.projectId}&experimentId=${this.experimentId}&experimentLabel=${this.experimentLabel}`;
        console.log('SessionRouter: Loading route with params:', params);
        if (this.parentProjectId !== this.projectId) {
            //Shared Project
            params += `&parentProjectId=${this.parentProjectId}`;
        }

        const { xnatRootUrl } = sessionMap;

        // Ensure we don't have double slashes
        const baseUrl = xnatRootUrl.endsWith('/') ? `${xnatRootUrl}VIEWER` : `${xnatRootUrl}/VIEWER`;

        console.log(`Routing to: ${baseUrl}${params}`);

        if (process.env.APP_CONFIG === 'config/xnat-dev.js') {
            window.location.href = `${params}`;
        } else {
            window.location.href = `${baseUrl}${params}`;
        }
    }

    async _setupDicomWebDataSource(studyInstanceUID) {
        // Dynamic server URL detection for robust deployment across different servers
        const getServerUrl = () => {
            if (typeof window !== 'undefined' && window.location) {
                const { protocol, hostname, port } = window.location;
                const portPart = port && port !== '80' && port !== '443' ? `:${port}` : '';
                return `${protocol}//${hostname}${portPart}`;
            }
            return 'http://localhost'; // Development fallback
        };

        const basePath = getServerUrl();

        console.log('Setting up XNAT data source with basePath:', basePath);

        // Configure the server details
        const server = {
            name: `XNAT Server - ${this.projectId}/${this.experimentId}`,
            wadoRoot: basePath,
            qidoRoot: basePath,
            wadoUri: basePath,
            enableStudyLazyLoad: true,
            imageRendering: 'wadouri',
            thumbnailRendering: 'wadouri',
            supportsFuzzyMatching: false,
            supportsWildcard: false,
            staticWado: true,
            singlepart: 'bulkdata,video',
            omitQuotationForMultipartRequest: true,
            // Set up a direct DICOM file handler
            dicomFileLoadSettings: {
                directAccessEnabled: true, // Enable direct file access
                acceptHeader: 'application/octet-stream', // Use correct mime type for DICOM files
                useRangeRequests: false // Don't use range requests for simple DICOM files
            },
            // Add headers for XNAT authentication
            requestOptions: {
                // Pass the JSESSIONID cookie to maintain session
                withCredentials: true,
                // Add custom headers if needed
                headers: {
                    Accept: 'application/json,application/octet-stream',
                },
            }
        };

        console.log('SessionRouter: Server configuration:', server);

        try {
            // Use multiple ways to get DicomMetadataStore
            const metadataStore = this.dicomMetadataStore ||
                window.DicomMetadataStore ||
                (window.OHIF && window.OHIF.DicomMetadataStore);

            if (!metadataStore) {
                console.error('DicomMetadataStore is not available - storing configuration without study registration');
            } else {
                console.log('DicomMetadataStore found, registering study:', studyInstanceUID);

                try {
                    // Check if study already exists
                    let study = metadataStore.getStudy(studyInstanceUID);

                    if (!study) {
                        // Create minimal study entry
                        metadataStore.addStudy({
                            StudyInstanceUID: studyInstanceUID,
                            PatientID: this.subjectId,
                            PatientName: this.subjectId,
                            AccessionNumber: this.experimentId,
                            StudyID: this.experimentId,
                            StudyDescription: this.experimentLabel || this.experimentId,
                            // Add study date and time from a cached data object or stored in sessionStorage
                            StudyDate: sessionStorage.getItem('xnat_studyDate') || new Date().toISOString().slice(0, 10).replace(/-/g, ''),
                            StudyTime: sessionStorage.getItem('xnat_studyTime') || new Date().toTimeString().slice(0, 8).replace(/:/g, ''),
                            NumInstances: 0,
                            // Add server details directly in the study object
                            wadoRoot: basePath,
                            qidoRoot: basePath,
                            wadoUri: basePath,
                            server
                        });

                        console.log('Study added to DicomMetadataStore');
                    } else {
                        // Study exists, update server details
                        study.wadoRoot = basePath;
                        study.qidoRoot = basePath;
                        study.wadoUri = basePath;
                        study.server = server;

                        console.log('Updated existing study in DicomMetadataStore');
                    }
                } catch (e) {
                    console.error('Error updating DicomMetadataStore:', e);
                }
            }

            // Store in global objects for extensions to use
            if (!window.OHIF) {
                window.OHIF = {};
            }

            if (!window.OHIF.servers) {
                window.OHIF.servers = {};
            }

            // Make sure it's an object
            if (!window.OHIF.servers || typeof window.OHIF.servers !== 'object') {
                window.OHIF.servers = {};
            }

            window.OHIF.servers.dicomWeb = [server];

            // Configure the data source path for the configured mode
            try {
                if (window.config && window.config.dataSources && window.config.dataSources.length > 0) {
                    // Find the xnat data source
                    const xnatDataSource = window.config.dataSources.find(ds => ds.sourceName === 'xnat');
                    if (xnatDataSource && xnatDataSource.configuration) {
                        // Directly update the paths
                        xnatDataSource.configuration.wadoUriRoot = basePath;
                        xnatDataSource.configuration.qidoRoot = basePath;
                        xnatDataSource.configuration.wadoRoot = basePath;
                        console.log('Updated xnat data source configuration with paths:', basePath);
                    }
                }
            } catch (e) {
                console.error('Error updating data source configuration:', e);
            }

            console.log('DICOM web server configuration stored in global objects');

        } catch (error) {
            console.error('Error setting up DICOM web data source:', error);
        }

        return studyInstanceUID;
    }
}