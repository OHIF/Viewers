import React, { useState } from 'react';
import { Button } from '@ohif/ui-next';

function Talas({ setCurrentView, commandsManager }) {
  const [selectedGroup, setSelectedGroup] = useState('');

  const handleBack = () => {
    setCurrentView('autometrics');
    setSelectedGroup(null); // Reset selected group

    // Return to original viewport layout
    commandsManager.run({
      commandName: 'setHangingProtocol',
      commandOptions: {
        protocolId: 'default',
      },
    });
  };

  const handleSubmit = () => {
    // Handle form submission
  };

  const handleSelect = groupName => {
    console.log(`Select button clicked for ${groupName}`);
    setSelectedGroup(groupName);

    // Change cursor to crosshair
    document.body.style.cursor = 'crosshair';

    // Add your custom logic here for selecting points
  };

  return (
    <div className="flex flex-col space-y-6 p-4">
      {/* Header with Back button and TALAS title */}
      <div className="mb-4 flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="text-sm"
        >
          Back
        </Button>
        <div className="text-lg font-semibold text-white">TALAS</div>
      </div>

      {/* TALAS content */}
      <div className="flex-1 space-y-4">
        {/* 1st Metatarsal (M1) Group */}
        <div className="space-y-2">
          <div className="border-b border-gray-600 pb-1 text-sm font-medium text-gray-300">
            1st Metatarsal (M1)
          </div>
          <div className="space-y-2 pl-2">
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">X:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">Y:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">Z:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <Button
              variant={selectedGroup === 'M1' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => handleSelect('M1')}
              className="w-full text-xs"
            >
              Select
            </Button>
          </div>
        </div>

        {/* 5th Metatarsal (M5) Group */}
        <div className="space-y-2">
          <div className="border-b border-gray-600 pb-1 text-sm font-medium text-gray-300">
            5th Metatarsal (M5)
          </div>
          <div className="space-y-2 pl-2">
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">X:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">Y:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">Z:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <Button
              variant={selectedGroup === 'M5' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => handleSelect('M5')}
              className="w-full text-xs"
            >
              Select
            </Button>
          </div>
        </div>

        {/* Calcaneous (C) Group */}
        <div className="space-y-2">
          <div className="border-b border-gray-600 pb-1 text-sm font-medium text-gray-300">
            Calcaneous (C)
          </div>
          <div className="space-y-2 pl-2">
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">X:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">Y:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">Z:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <Button
              variant={selectedGroup === 'C' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => handleSelect('C')}
              className="w-full text-xs"
            >
              Select
            </Button>
          </div>
        </div>

        {/* Talus (T) Group */}
        <div className="space-y-2">
          <div className="border-b border-gray-600 pb-1 text-sm font-medium text-gray-300">
            Talus (T)
          </div>
          <div className="space-y-2 pl-2">
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">X:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">Y:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-4 text-xs text-gray-400">Z:</label>
              <input
                type="text"
                readOnly
                className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-300"
                placeholder="0.00"
              />
            </div>
            <Button
              variant={selectedGroup === 'T' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => handleSelect('T')}
              className="w-full text-xs"
            >
              Select
            </Button>
          </div>
        </div>
      </div>

      {/* Submit button at the bottom */}
      <div className="flex flex-col space-y-3 border-t border-gray-600 pt-4">
        <Button
          variant="default"
          className="w-full"
          onClick={handleSubmit}
        >
          How to...
        </Button>
        <Button
          variant="default"
          className="w-full"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}

export default Talas;
