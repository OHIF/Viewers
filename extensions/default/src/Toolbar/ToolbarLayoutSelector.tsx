// File: extensions/default/src/Toolbar/ToolbarLayoutSelector.tsx

import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { CommandsManager } from '@ohif/core';

// Import the new LayoutSelector from ui-next
import { LayoutSelector } from '../../../../platform/ui-next/src/components/LayoutSelector';

function ToolbarLayoutSelectorWithServices({
  commandsManager,
  servicesManager,
  rows = 3,
  columns = 4,
  ...props
}) {
  const [isDisabled, setIsDisabled] = useState(false);
  const { customizationService } = servicesManager.services;

  // Get the presets from the customization service
  const commonPresets = customizationService?.getCustomization('layoutSelector.commonPresets') || [
    {
      icon: 'layout-single',
      commandOptions: {
        numRows: 1,
        numCols: 1,
      },
    },
    {
      icon: 'layout-side-by-side',
      commandOptions: {
        numRows: 1,
        numCols: 2,
      },
    },
    {
      icon: 'layout-four-up',
      commandOptions: {
        numRows: 2,
        numCols: 2,
      },
    },
    {
      icon: 'layout-three-row',
      commandOptions: {
        numRows: 3,
        numCols: 1,
      },
    },
  ];

  // Get the advanced presets generator from the customization service
  const advancedPresetsGenerator = customizationService?.getCustomization(
    'layoutSelector.advancedPresetGenerator'
  );

  // Generate the advanced presets
  const advancedPresets = advancedPresetsGenerator
    ? advancedPresetsGenerator({ servicesManager })
    : [
        {
          title: 'MPR',
          icon: 'layout-three-col',
          commandOptions: {
            protocolId: 'mpr',
          },
        },
        {
          title: '3D four up',
          icon: 'layout-four-up',
          commandOptions: {
            protocolId: '3d-four-up',
          },
        },
        {
          title: '3D main',
          icon: 'layout-three-row',
          commandOptions: {
            protocolId: '3d-main',
          },
        },
        {
          title: 'Axial Primary',
          icon: 'layout-side-by-side',
          commandOptions: {
            protocolId: 'axial-primary',
          },
        },
        {
          title: '3D only',
          icon: 'layout-single',
          commandOptions: {
            protocolId: '3d-only',
          },
        },
        {
          title: '3D primary',
          icon: 'layout-side-by-side',
          commandOptions: {
            protocolId: '3d-primary',
          },
        },
        {
          title: 'Frame View',
          icon: 'icon-stack',
          commandOptions: {
            protocolId: 'frame-view',
          },
        },
      ];

  // The callback for a "common" or "custom" layout selection
  const onSelection = useCallback(
    commandOptions => {
      commandsManager.run({
        commandName: 'setViewportGridLayout',
        commandOptions,
      });
      // Optionally disable interactions if needed
      setIsDisabled(true);
    },
    [commandsManager]
  );

  // The callback for an "advanced" layout selection
  const onSelectionPreset = useCallback(
    commandOptions => {
      commandsManager.run({
        commandName: 'setHangingProtocol',
        commandOptions,
      });
      setIsDisabled(true);
    },
    [commandsManager]
  );

  const handleMouseEnter = () => {
    // If you want to re-enable, for example
    setIsDisabled(false);
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      <LayoutSelector
        rows={rows}
        columns={columns}
        onSelection={onSelection}
        onSelectionPreset={onSelectionPreset}
        commonPresets={commonPresets}
        advancedPresets={advancedPresets}
        tooltipDisabled={isDisabled}
        servicesManager={servicesManager}
        {...props}
      />
    </div>
  );
}

ToolbarLayoutSelectorWithServices.propTypes = {
  commandsManager: PropTypes.instanceOf(CommandsManager),
  servicesManager: PropTypes.object,
  rows: PropTypes.number,
  columns: PropTypes.number,
};

export default ToolbarLayoutSelectorWithServices;
