import React, { useEffect, useState, useContext } from 'react';
import * as cornerstone from '@cornerstonejs/core';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CommandsManager, ServicesManager } from '@ohif/core';
// OHIF Modules
import { log, utils } from '@ohif/core';
import { servicesManager } from '../App';
import metadata from '@ohif/core/src/classes'; // Fixed import statement
// Removed useServices import as it is not exported from '@ohif/ui'

// Local imports
import { isLoggedIn, xnatAuthenticate } from '../../../../extensions/xnat/src/index';
import retrieveDicomWebMetadata from '../lib/xnatDicomWeb/retrieveDicomWebMetadata';

const { OHIFStudyMetadata } = metadata;

const VALID_BACKGROUND_MODALITIES = ['MR', 'CT'];
const VALID_OVERLAY_MODALITIES = ['PT', 'NM', 'MR'];

function XNATStandaloneRouting({ location }) {
  console.log('XNATStandaloneRouting mounted', { location });
  
  const [studies, setStudies] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const viewportGridService = servicesManager.services.viewportGridService;
  console.log('HERE');
  console.log('Current pathname:', window.location.pathname);
  console.log('Current search:', window.location.search);
  console.log('ServicesManager:', servicesManager);
  const parseQueryAndRetrieveDICOMWebData = async (rootUrl, query) => {
    const { projectId, subjectId, experimentId } = query;
    
    try {
      const commandsManager = new CommandsManager();
      console.log('Query parameters:', { projectId, subjectId, experimentId });

      // Log the command execution
      console.log('Setting root URL:', rootUrl);
      await commandsManager.runCommand('xnatSetRootUrl', {
        url: rootUrl,
      });

      // Construct API URL
      const apiUrl = new URL(`${window.location.origin}/xapi/viewer/projects/${projectId}/experiments/${experimentId}`);
      console.log('Full API URL:', apiUrl.toString());

      // Make the fetch request with explicit options
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include' // This ensures cookies are sent
      });

      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: apiUrl.toString()
        });
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      setStudies(data);
      setLoading(false);

      // Ensure the dataSource configuration gets correct parameters
      if (window.config && window.config.dataSources && window.config.dataSources[0]) {
        const dataSourceConfig = window.config.dataSources[0].configuration;
        
        // Replace template variables with actual values
        Object.keys(dataSourceConfig).forEach(key => {
          if (typeof dataSourceConfig[key] === 'string') {
            dataSourceConfig[key] = dataSourceConfig[key]
              .replace('${projectId}', projectId)
              .replace('${experimentId}', experimentId)
              .replace('${subjectId}', subjectId);
          }
        });
        
        console.log('Updated dataSource configuration:', dataSourceConfig);
      }
    } catch (error) {
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('XNATStandaloneRouting useEffect triggered');
    const query = new URLSearchParams(location.search);
    console.log('URL Parameters:', Object.fromEntries(query.entries()));
    
    // Check if rootUrl exists and log it
    const rootUrl = window.config.rootUrl || '/';
    console.log('Using rootUrl:', rootUrl);
    
    parseQueryAndRetrieveDICOMWebData(rootUrl, Object.fromEntries(query.entries()))
      .catch(error => {
        console.error('DICOM Web Data Retrieval Error:', error);
        console.log('Error Details:', {
          message: error.message,
          stack: error.stack,
          response: error.response,
          rootUrl,
          query: Object.fromEntries(query.entries())
        });
        setError(error);
      });
  }, [location]);

  const viewportOptions = {
    background: VALID_BACKGROUND_MODALITIES,
    overlay: VALID_OVERLAY_MODALITIES,
  };

  console.log('Studies data:', studies);
  console.log('ViewportGrid props:', {
    studies,
    viewportOptions,
    viewportGridService
  });

  if (error) {
    return (
      <div>
        Error loading viewer: {error.message}
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return studies ? (
    <div className="viewport-container">
      <ViewportGrid
        studies={studies}
        viewportOptions={viewportOptions}
        viewportGridService={viewportGridService}
      />
    </div>
  ) : null;
}

XNATStandaloneRouting.propTypes = {
  location: PropTypes.object.isRequired,
};

export default XNATStandaloneRouting;
