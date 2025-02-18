import React, { useEffect, useState } from 'react';
import * as cornerstone from '@cornerstonejs/core';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CommandsManager } from '@ohif/core';
// OHIF Modules
import { log, utils } from '@ohif/core';
import metadata from '@ohif/core/src/classes'; // Fixed import statement
// Removed useServices import as it is not exported from '@ohif/ui'

// Local imports
import { isLoggedIn, xnatAuthenticate } from '../../../../extensions/xnat/src/index';
import retrieveDicomWebMetadata from '../lib/xnatDicomWeb/retrieveDicomWebMetadata';
import { ViewportGrid } from '@ohif/ui';

const { OHIFStudyMetadata } = metadata;

const VALID_BACKGROUND_MODALITIES = ['MR', 'CT'];
const VALID_OVERLAY_MODALITIES = ['PT', 'NM', 'MR'];

function XNATStandaloneRouting({ location }) {
  const [studies, setStudies] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { viewportGridService } = this.servicesManager.services;
  const parseQueryAndRetrieveDICOMWebData = async (rootUrl, query) => {
    const { projectId, subjectId, experimentId } = query;
    
    try {
      const commandsManager = new CommandsManager();

      await commandsManager.runCommand('xnatSetRootUrl', {
        url: rootUrl,
      });

      // XNAT specific commands
      await Promise.all([
        commandsManager.runCommand('xnatCheckAndSetAiaaSettings', { projectId }),
        commandsManager.runCommand('xnatCheckAndSetRoiColorList', { projectId }),
        commandsManager.runCommand('xnatCheckAndSetRoiPresets', { projectId }),
        commandsManager.runCommand('xnatCheckAndSetPermissions', {
          projectId,
          parentProjectId: query.parentProjectId,
          subjectId,
        })
      ]);

      // Rest of your data fetching logic here
      // Convert to use fetch instead of XMLHttpRequest
      const response = await fetch(`${rootUrl}xapi/viewer/projects/${projectId}/experiments/${experimentId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Process your data and update state
      setStudies(data);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const queryObject = Object.fromEntries(query.entries());
    parseQueryAndRetrieveDICOMWebData(window.config.rootUrl, queryObject);
  }, [location]);

  if (error || loading) {
    return (
      <div>
        {error ? `Error: ${error.message}` : 'Loading...'}
      </div>
    );
  }

  return studies ? (
    <div className="viewport-container">
      <ViewportGrid
        studies={studies}
        viewportOptions={{
          background: VALID_BACKGROUND_MODALITIES,
          overlay: VALID_OVERLAY_MODALITIES,
        }}
        viewportGridService={viewportGridService}
      />
    </div>
  ) : null;
}

XNATStandaloneRouting.propTypes = {
  location: PropTypes.object.isRequired,
};

export default XNATStandaloneRouting;
