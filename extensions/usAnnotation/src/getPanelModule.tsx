import React from 'react';

import USAnnotationPanel from './panels/USAnnotationPanel';

/**
 * Creates and returns the panel module for ultrasound annotation
 * @param params - Object containing commandsManager, servicesManager, and extensionManager
 * @returns Array of panel configurations
 */
const getPanelModule = ({ commandsManager, servicesManager, extensionManager }: withAppTypes) => {
  /**
   * Wrapper component for the USAnnotationPanel that injects the required props
   * @param props - Component props including configuration
   * @returns The wrapped USAnnotationPanel component
   */
  const wrappedUSAnnotationPanel = ({ configuration }) => {
    return <USAnnotationPanel />;
  };

  return [
    {
      name: 'USAnnotationPanel',
      iconName: 'tab-linear',
      iconLabel: 'US Annotation',
      label: 'USAnnotation',
      component: wrappedUSAnnotationPanel,
    },
  ];
};

export default getPanelModule;
