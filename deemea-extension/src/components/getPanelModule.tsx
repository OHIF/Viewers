import React from 'react';

function AddTestMeasurementButton({ servicesManager }) {
  const { CommandsManager } = servicesManager.services;

  const handleClick = () => {
    CommandsManager.runCommand('addTestMeasurement');
  };

  return (
    <button onClick={handleClick}>
      Add Test Measurement
    </button>
  );
}

const getPanelModule = ({ commandsManager, extensionManager, servicesManager }) => {
    console.log('getPanelModule');
  return [
    {
      name: 'deemea-panel',
      iconName: 'list-bullets',
      iconLabel: 'Deemea Panel',
      label: 'Deemea Panel',
      component: AddTestMeasurementButton.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },
  ];
};

export default getPanelModule;