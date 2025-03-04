import checkSessionJSONExists from './checkSessionJSONExists.js';
import fetchJSON from '../../utils/IO/fetchJSON';
import sessionMap from '../../utils/sessionMap';
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
  }

  go() {
    console.log('SessionRouter.go() called with params:', {
      projectId: this.projectId,
      subjectId: this.subjectId,
      experimentId: this.experimentId
    });

    try {
      const url = `/data/projects/${this.projectId}/experiments/${this.experimentId}?format=json`;
      console.log('SessionRouter fetching session data from:', url);
      
      // Fetch the experiment data from XNAT API
      return fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`XNAT API request failed: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(async data => {
          console.log('SessionRouter: Received data from XNAT API', data);

          // Extract study instance UID from the response
          let studyInstanceUID = null;
          if (data && data.items && data.items[0] && data.items[0].data_fields) {
            // Try multiple possible field names
            studyInstanceUID = data.items[0].data_fields.studyInstanceUID || 
                              data.items[0].data_fields.UID ||
                              data.items[0].data_fields.study_uid;
            
            // If still not found, try to look in study_id or ID fields
            if (!studyInstanceUID) {
              studyInstanceUID = data.items[0].data_fields.study_id || 
                                data.items[0].data_fields.ID;
            }
            
            console.log('SessionRouter: Extracted studyInstanceUID:', studyInstanceUID);
          }

          if (!studyInstanceUID) {
            throw new Error('No StudyInstanceUID found in XNAT response');
          }

          // Add study to DicomMetadataStore using OHIF v3 API
          if (!DicomMetadataStore.getStudy(studyInstanceUID)) {
            DicomMetadataStore.addStudy({ StudyInstanceUID: studyInstanceUID });
          }
          
          console.log('SessionRouter: Added study to DicomMetadataStore:', studyInstanceUID);
          
          // Set up the DICOM web data source
          try {
            await this._setupDicomWebDataSource(studyInstanceUID);
          } catch (error) {
            console.error('Failed to set up DICOM web data source:', error);
            // Continue even if this fails, since we at least have the study UID
          }
          
          // Return the study instance UID for other components to use
          return [studyInstanceUID];
        })
        .catch(error => {
          console.error('Error in sessionRouter.go():', error);
          throw error;
        });
    } catch (error) {
      console.error('SessionRouter.go() failed:', error);
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
      `/data/projects/${this.projectId}/experiments/${this.experimentId}`
    )
      .promise.then(result => {
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
    // URL for the DICOM web service through XNAT - FIXED PATH to match Java controller
    const wadoRoot = `/xapi/viewerDicomweb/aets/${this.projectId}/${this.experimentId}/rs`;
    
    console.log('Setting up DICOM Web data source with wadoRoot:', wadoRoot);
    
    // Configure the server details
    const server = {
      wadoRoot,
      qidoRoot: wadoRoot,
      wadoUri: wadoRoot,
      enableStudyLazyLoad: false,
      imageRendering: 'wadors',
      thumbnailRendering: 'wadors',
      supportsFuzzyMatching: false,
      supportsWildcard: true,
    };

    try {
      // In OHIF v3, we need to use DICOMWeb data source's retrieve methods
      // to load the metadata and images
      const study = DicomMetadataStore.getStudy(studyInstanceUID);
      
      if (study) {
        // Add server information to the study
        study.wadoRoot = wadoRoot;
        study.qidoRoot = wadoRoot;
        study.wadoUri = wadoRoot;
        study.server = server;
        
        console.log('DICOM web server info added to study:', studyInstanceUID);
      } else {
        console.warn('Could not find study to attach DICOM web info:', studyInstanceUID);
      }
      
      // Store server configuration in sessionMap for other components to use
      sessionMap.servers = sessionMap.servers || [];
      sessionMap.servers.push({
        studyInstanceUID,
        server
      });
      
      console.log('DICOM web server configuration stored in sessionMap');
    } catch (error) {
      console.error('Failed to set up DICOM web data source:', error);
      throw error;
    }
  }
}
