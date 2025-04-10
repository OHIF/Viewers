import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import XNATNavigationPanel from '../xnat-components/XNATNavigationPanel';

/**
 * Wraps the XNATNavigationPanel and provides services
 * 
 * @param {object} params
 * @param {object} extensionManager
 * @param {object} servicesManager
 * @param {object} commandsManager
 */
function WrappedXNATNavigationPanel({ extensionManager, servicesManager, commandsManager }) {
  console.log('XNAT: WrappedXNATNavigationPanel rendering with', {
    extensionManager: typeof extensionManager,
    servicesManager: typeof servicesManager,
    commandsManager: typeof commandsManager
  });
  
  // Get the data source
  const [dataSource] = extensionManager.getActiveDataSource();
  
  console.log('XNAT: Active dataSource for navigation:', dataSource);
  
  // Debug available icons in the UI package
  useEffect(() => {
    try {
      // Check what's available in the UI package
      const uiPackage = window['@ohif/ui'];
      console.log('XNAT: OHIF UI package available icons:', 
        uiPackage?.Icons ? Object.keys(uiPackage.Icons) : 'Icons not directly accessible');
    } catch (err) {
      console.error('XNAT: Error checking available UI components', err);
    }
    
    // Check if this is connected to XNAT properly
    try {
      const url = 'data/archive/projects/?format=json';
      console.log('XNAT: Testing connection to XNAT API at', url);
      
      fetch(url)
        .then(response => {
          console.log('XNAT: API response status:', response.status);
          return response.json();
        })
        .then(data => {
          console.log('XNAT: API data received:', data);
        })
        .catch(err => {
          console.error('XNAT: API fetch error:', err);
        });
    } catch (err) {
      console.error('XNAT: Error testing API connection', err);
    }
  }, []);

  console.log('XNAT: Rendering XNATNavigationPanel with servicesManager');
  
  return (
    <div className="xnat-debug-wrapper">
      <XNATNavigationPanel
        servicesManager={servicesManager}
      />
    </div>
  );
}

WrappedXNATNavigationPanel.propTypes = {
  extensionManager: PropTypes.object.isRequired,
  servicesManager: PropTypes.object.isRequired,
  commandsManager: PropTypes.object.isRequired,
};

export default WrappedXNATNavigationPanel; 