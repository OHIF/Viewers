import React from 'react';
import DentalThemeToggle from './DentalThemeToggle';

/**
 * getPanelModule - Provides the panel module for the dental theme toggle
 * @param {Object} params - Extension params including servicesManager
 * @returns {Array} Array of panel module definitions
 */
export default function getPanelModule({ servicesManager, commandsManager, extensionManager }) {
  return [
    {
      name: 'dentalThemeToggle',
      iconName: 'icon-settings',
      iconLabel: 'Theme',
      label: 'Dental Theme',
      component: props => (
        <DentalThemeToggle
          {...props}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
          extensionManager={extensionManager}
        />
      ),
    },
  ];
}
