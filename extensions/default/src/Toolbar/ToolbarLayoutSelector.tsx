import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { LayoutSelector as OHIFLayoutSelector, ToolbarButton, LayoutPreset } from '@ohif/ui';
import { ServicesManager } from '@ohif/core';

const defaultCommonPresets = [
  {
    icon: 'layout-common-1x1',
    commandOptions: {
      numRows: 1,
      numCols: 1,
    },
  },
  {
    icon: 'layout-common-1x2',
    commandOptions: {
      numRows: 1,
      numCols: 2,
    },
  },
  {
    icon: 'layout-common-2x2',
    commandOptions: {
      numRows: 2,
      numCols: 2,
    },
  },
  {
    icon: 'layout-common-2x3',
    commandOptions: {
      numRows: 2,
      numCols: 3,
    },
  },
];

const generateAdvancedPresets = hangingProtocolService => {
  const hangingProtocols = Array.from(hangingProtocolService.protocols.values());
  return hangingProtocols
    .map(hp => {
      if (!hp.isPreset) {
        return null;
      }
      return {
        icon: hp.icon,
        title: hp.name,
        commandOptions: {
          protocolId: hp.id,
        },
      };
    })
    .filter(preset => preset !== null);
};

function ToolbarLayoutSelectorWithServices({ servicesManager, ...props }) {
  const { toolbarService } = servicesManager.services;

  const [isDisabled, setIsDisabled] = useState(false);

  const handleMouseEnter = () => {
    setIsDisabled(false);
  };

  const onSelection = useCallback(
    props => {
      toolbarService.recordInteraction({
        interactionType: 'action',
        commands: [
          {
            commandName: 'setViewportGridLayout',
            commandOptions: { ...props },
          },
        ],
      });
      setIsDisabled(true);
    },
    [toolbarService]
  );
  const onSelectionPreset = useCallback(
    props => {
      toolbarService.recordInteraction({
        interactionType: 'action',
        commands: [
          {
            commandName: 'setHangingProtocol',
            commandOptions: { ...props },
          },
        ],
      });
      setIsDisabled(true);
    },
    [toolbarService]
  );

  return (
    <div onMouseEnter={handleMouseEnter}>
      <LayoutSelector
        {...props}
        onSelection={onSelection}
        onSelectionPreset={onSelectionPreset}
        servicesManager={servicesManager}
        tooltipDisabled={isDisabled}
      />
    </div>
  );
}

function LayoutSelector({
  rows,
  columns,
  className,
  onSelection,
  onSelectionPreset,
  servicesManager,
  tooltipDisabled,
  ...rest
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { customizationService, hangingProtocolService } = servicesManager.services;
  const commonPresets = customizationService.get('commonPresets') || defaultCommonPresets;
  const advancedPresets =
    customizationService.get('advancedPresets') || generateAdvancedPresets(hangingProtocolService);

  const closeOnOutsideClick = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener('click', closeOnOutsideClick);
    return () => {
      window.removeEventListener('click', closeOnOutsideClick);
    };
  }, [isOpen]);

  const onInteractionHandler = () => {
    setIsOpen(!isOpen);
  };
  const DropdownContent = isOpen ? OHIFLayoutSelector : null;

  return (
    <ToolbarButton
      id="Layout"
      label="Layout"
      icon="tool-layout"
      onInteraction={onInteractionHandler}
      className={className}
      rounded={rest.rounded}
      disableToolTip={tooltipDisabled}
      dropdownContent={
        DropdownContent !== null && (
          <div className="flex">
            <div className="bg-secondary-dark flex flex-col gap-2.5 p-2">
              <div className="text-aqua-pale text-xs">Common</div>

              <div className="flex gap-4">
                {commonPresets.map((preset, index) => (
                  <LayoutPreset
                    key={index}
                    classNames="hover:bg-primary-dark group p-1"
                    icon={preset.icon}
                    commandOptions={preset.commandOptions}
                    onSelection={onSelection}
                  />
                ))}
              </div>

              <div className="h-[2px] bg-black"></div>

              <div className="text-aqua-pale text-xs">Advanced</div>

              <div className="flex flex-col gap-2.5">
                {advancedPresets.map((preset, index) => (
                  <LayoutPreset
                    key={index + commonPresets.length}
                    classNames="hover:bg-primary-dark group flex gap-2 p-1"
                    icon={preset.icon}
                    title={preset.title}
                    commandOptions={preset.commandOptions}
                    onSelection={onSelectionPreset}
                  />
                ))}
              </div>
            </div>

            <div className="bg-primary-dark flex flex-col gap-2.5 border-l-2 border-solid border-black  p-2">
              <div className="text-aqua-pale text-xs">Custom</div>
              <DropdownContent
                rows={rows}
                columns={columns}
                onSelection={onSelection}
              />
              <p className="text-aqua-pale text-xs leading-tight">
                Hover to select <br></br>rows and columns <br></br> Click to apply
              </p>
            </div>
          </div>
        )
      }
      isActive={isOpen}
      type="toggle"
    />
  );
}

LayoutSelector.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
  onLayoutChange: PropTypes.func,
  servicesManager: PropTypes.instanceOf(ServicesManager),
};

LayoutSelector.defaultProps = {
  columns: 4,
  rows: 3,
  onLayoutChange: () => {},
};

export default ToolbarLayoutSelectorWithServices;
