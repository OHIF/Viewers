import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import OverreadNavigationPanel from '../xnat-components/OverreadNavigationPanel';

/**
 * Wraps the OverreadNavigationPanel and provides services
 * 
 * @param {object} params
 * @param {object} extensionManager
 * @param {object} servicesManager
 * @param {object} commandsManager
 */
function WrappedOverreadNavigationPanel({ extensionManager, servicesManager, commandsManager }) {
  
  // Get the data source - add null check to prevent TypeError
  const [dataSource] = extensionManager?.getActiveDataSource?.() || [];
    
  // Debug available icons in the UI package
  useEffect(() => {
    try {
      // Check what's available in the UI package
      const uiPackage = window['@ohif/ui'];
    } catch (err) {
      console.error('Overread: Error checking available UI components', err);
    }
    
    // Check if this is connected to Overread properly
    try {
      const url = 'data/archive/subjects?format=json';
      
      fetch(url)
        .then(response => {
          return response.json();
        })
        .then(data => {
          console.log('Overread: API data received:', data);
        })
        .catch(err => {
          console.error('Overread: API fetch error:', err);
        });
    } catch (err) {
      console.error('Overread: Error testing API connection', err);
    }
  }, []);
  
  return (
    <div className="h-full">
      <OverreadNavigationPanel
        servicesManager={servicesManager}
      />
    </div>
  );
}

WrappedOverreadNavigationPanel.propTypes = {
  extensionManager: PropTypes.object.isRequired,
  servicesManager: PropTypes.object.isRequired,
  commandsManager: PropTypes.object.isRequired,
};

export default WrappedOverreadNavigationPanel; 