import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { LayoutSelector as OHIFLayoutSelector, ToolbarButton } from '@ohif/ui';
import { ServicesManager } from '@ohif/core';

function ToolbarLayoutSelectorWithServices({ servicesManager, commands, ...props }) {
  const { toolbarService, viewportGridService } = servicesManager.services;

  const onInteraction = useCallback(
    args => {
      const viewportId = viewportGridService.getActiveViewportId();
      const refreshProps = {
        viewportId,
      };

      if (props.onLayoutChange) {
        props.onLayoutChange(args);
      }
      toolbarService.recordInteraction({ commands }, { ...args, refreshProps });
    },
    [toolbarService]
  );

  return (
    <LayoutSelector
      {...props}
      onInteraction={onInteraction}
    />
  );
}

function LayoutSelector({ rows, columns, className, onInteraction, ...rest }) {
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
          <DropdownContent
            rows={rows}
            columns={columns}
            onSelection={onInteraction}
          />
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
  rows: 3,
  columns: 3,
  onLayoutChange: () => {},
};

export default ToolbarLayoutSelectorWithServices;
