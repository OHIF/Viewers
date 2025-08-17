import React, { useState, useEffect } from 'react';
import { Button } from '@ohif/ui-next';
import Talas from './Talas';

const AutometricsPanel = ({ commandsManager, servicesManager }) => {
  const [currentView, setCurrentView] = useState('autometrics'); // 'autometrics' or 'talas'

  // Handle ESC key to exit select mode
  const handleButtonClick = buttonName => {
    console.log(`${buttonName} button clicked`);

    if (buttonName === 'TALAS') {
      setCurrentView('talas');
      commandsManager.run({
        commandName: 'setHangingProtocol',
        commandOptions: {
          protocolId: 'mpr',
        },
      });

      // Enable crosshairs
      commandsManager.run({
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'Crosshairs',
          toolGroupId: 'mpr',
        },
      });
    } else {
      commandsManager.run({
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'Pan',
          toolGroupId: 'default',
        },
      });
      document.body.style.cursor = 'default';
    }
  };

  // TALAS view
  if (currentView && currentView === 'talas') {
    return (
      <Talas
        setCurrentView={setCurrentView}
        commandsManager={commandsManager}
      />
    );
  }

  // Default Autometrics view
  return (
    <div className="flex flex-col space-y-6 p-4">
      <div className="mb-4 text-lg font-semibold text-white">Autometrics</div>

      {/* Angular Measurements Group */}
      <div className="space-y-3">
        <div className="border-b border-gray-600 pb-1 text-sm font-medium text-gray-300">
          Angular Measurements
        </div>
        <div className="flex flex-col space-y-2 pl-2">
          <Button
            variant="default"
            className="w-full justify-start text-sm"
            onClick={() => handleButtonClick('M1M2')}
          >
            M1M2
          </Button>

          <Button
            variant="default"
            className="w-full justify-start text-sm"
            onClick={() => handleButtonClick('TMT-DOR')}
          >
            TMT-DOR
          </Button>

          <Button
            variant="default"
            className="w-full justify-start text-sm"
            onClick={() => handleButtonClick('TMT-LAT')}
          >
            TMT-LAT
          </Button>

          <Button
            variant="default"
            className="w-full justify-start text-sm"
            onClick={() => handleButtonClick('CP')}
          >
            CP
          </Button>

          <Button
            variant="default"
            className="w-full justify-start text-sm"
            onClick={() => handleButtonClick('HA')}
          >
            HA
          </Button>
        </div>
      </div>

      {/* Foot Ankle Offset Group */}
      <div className="space-y-3">
        <div className="border-b border-gray-600 pb-1 text-sm font-medium text-gray-300">
          Foot Ankle Offset
        </div>
        <div className="flex flex-col space-y-2 pl-2">
          <Button
            variant="default"
            className="w-full justify-start text-sm"
            onClick={() => handleButtonClick('TALAS')}
          >
            TALAS
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AutometricsPanel;
