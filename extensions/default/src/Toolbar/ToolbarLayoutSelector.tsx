// File: extensions/default/src/Toolbar/ToolbarLayoutSelector.tsx

import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { CommandsManager } from '@ohif/core';

// Import the new LayoutSelector from ui-next
import { LayoutSelector } from '../../../../platform/ui-next/src/components/LayoutSelector';

function ToolbarLayoutSelectorWithServices({
  commandsManager,
  servicesManager,
  commonPresets = [],
  advancedPresets = [],
  rows = 3,
  columns = 4,
  ...props
}) {
  const [isDisabled, setIsDisabled] = useState(false);

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
        tooltipDisabled={isDisabled} // if needed
        servicesManager={servicesManager}
      />
    </div>
  );
}

ToolbarLayoutSelectorWithServices.propTypes = {
  commandsManager: PropTypes.instanceOf(CommandsManager),
  servicesManager: PropTypes.object,
  commonPresets: PropTypes.array,
  advancedPresets: PropTypes.array,
  rows: PropTypes.number,
  columns: PropTypes.number,
};

export default ToolbarLayoutSelectorWithServices;
