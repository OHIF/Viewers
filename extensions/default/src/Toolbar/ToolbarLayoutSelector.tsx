// Updated ToolbarLayoutSelector.tsx
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { CommandsManager } from '@ohif/core';

import { LayoutSelector } from '@ohif/ui-next';

function ToolbarLayoutSelectorWithServices({
  commandsManager,
  servicesManager,
  rows = 3,
  columns = 4,
  ...props
}) {
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

  // Unified selection handler that dispatches to the appropriate command
  const handleSelectionChange = useCallback(
    (commandOptions, isPreset) => {
      if (isPreset) {
        // Advanced preset selection
        commandsManager.run({
          commandName: 'setHangingProtocol',
          commandOptions,
        });
      } else {
        // Common preset or custom grid selection
        commandsManager.run({
          commandName: 'setViewportGridLayout',
          commandOptions,
        });
      }
    },
    [commandsManager]
  );

  return (
    <div
      id="Layout"
      data-cy="Layout"
    >
      <LayoutSelector
        onSelectionChange={handleSelectionChange}
        {...props}
      >
        <LayoutSelector.Trigger tooltip="Change layout" />
        <LayoutSelector.Content>
          {/* Left side - Presets */}
          {(commonPresets.length > 0 || advancedPresets.length > 0) && (
            <div className="bg-popover flex flex-col gap-2.5 rounded-lg p-2">
              {commonPresets.length > 0 && (
                <>
                  <LayoutSelector.PresetSection title="Common">
                    {commonPresets.map((preset, index) => (
                      <LayoutSelector.Preset
                        key={`common-preset-${index}`}
                        icon={preset.icon}
                        commandOptions={preset.commandOptions}
                        isPreset={false}
                      />
                    ))}
                  </LayoutSelector.PresetSection>
                  <LayoutSelector.Divider />
                </>
              )}

              {advancedPresets.length > 0 && (
                <LayoutSelector.PresetSection title="Advanced">
                  {advancedPresets.map((preset, index) => (
                    <LayoutSelector.Preset
                      key={`advanced-preset-${index}`}
                      title={preset.title}
                      icon={preset.icon}
                      commandOptions={preset.commandOptions}
                      disabled={preset.disabled}
                      isPreset={true}
                    />
                  ))}
                </LayoutSelector.PresetSection>
              )}
            </div>
          )}

          {/* Right Side - Grid Layout */}
          <div className="bg-muted flex flex-col gap-2.5 border-l-2 border-solid border-black p-2">
            <div className="text-muted-foreground text-xs">Custom</div>
            <LayoutSelector.GridSelector
              rows={rows}
              columns={columns}
            />
            <LayoutSelector.HelpText>
              Hover to select <br />
              rows and columns <br /> Click to apply
            </LayoutSelector.HelpText>
          </div>
        </LayoutSelector.Content>
      </LayoutSelector>
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
