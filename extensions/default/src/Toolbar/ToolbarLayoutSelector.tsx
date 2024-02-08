import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { LayoutSelector as OHIFLayoutSelector, ToolbarButton, LayoutPreset } from '@ohif/ui';
import { ServicesManager } from '@ohif/core';

function ToolbarLayoutSelectorWithServices({ servicesManager, ...props }) {
  const { toolbarService } = servicesManager.services;

  const onSelection = useCallback(
    props => {
      toolbarService.recordInteraction({
        interactionType: 'action',
        commands: [
          {
            commandName: 'setViewportGridLayout',
            commandOptions: { ...props },
            context: 'DEFAULT',
          },
        ],
      });
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
            context: 'DEFAULT',
          },
        ],
      });
    },
    [toolbarService]
  );

  return (
    <LayoutSelector
      {...props}
      onSelection={onSelection}
      onSelectionPreset={onSelectionPreset}
    />
  );
}

function LayoutSelector({ rows, columns, className, onSelection, onSelectionPreset, ...rest }) {
  const [isOpen, setIsOpen] = useState(false);

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

  const onInteractionHandler = () => setIsOpen(!isOpen);
  const DropdownContent = isOpen ? OHIFLayoutSelector : null;

  const commonPresets = [
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

  const advancedPresets = [
    { icon: 'layout-advanced-mpr', title: 'MPR', commandOptions: { protocolId: 'mpr' } },
    {
      icon: 'layout-advanced-axial-primary',
      title: 'Axial Primary',
      commandOptions: { protocolId: 'primaryAxial' },
    },
    {
      icon: 'layout-advanced-3d-four-up',
      title: '3D four up',
      commandOptions: { protocolId: 'fourUp' },
    },
    { icon: 'layout-advanced-3d-main', title: '3D main', commandOptions: { protocolId: 'main3D' } },
    { icon: 'layout-advanced-3d-only', title: '3D only', commandOptions: { protocolId: 'only3D' } },
    {
      icon: 'layout-advanced-3d-primary',
      title: '3D primary',
      commandOptions: { protocolId: 'primary3D' },
    },
  ];

  return (
    <ToolbarButton
      id="Layout"
      label="Grid Layout"
      icon="tool-layout"
      onInteraction={onInteractionHandler}
      className={className}
      rounded={rest.rounded}
      dropdownContent={
        DropdownContent !== null && (
          <div className="flex">
            <div className="bg-secondary-dark flex flex-col gap-2.5 p-2">
              <div className="font-inter text-aqua-pale text-xs">Common</div>

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

              <div className="font-inter text-aqua-pale text-xs">Advanced</div>

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
              <div className="font-inter text-aqua-pale text-xs">Custom</div>
              <DropdownContent
                rows={rows}
                columns={columns}
                onSelection={onSelection}
              />
              <p className="font-inter text-aqua-pale text-xs leading-tight">
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
