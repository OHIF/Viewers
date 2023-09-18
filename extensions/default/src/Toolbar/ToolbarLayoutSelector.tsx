import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LayoutSelector as OHIFLayoutSelector, ToolbarButton } from '@ohif/ui';

import { ServicesManager } from '@ohif/core';

function LayoutSelector({ rows, columns, className, servicesManager, ...rest }) {
  const [isOpen, setIsOpen] = useState(false);

  const { hangingProtocolService, toolbarService } = (servicesManager as ServicesManager).services;

  const closeOnOutsideClick = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      hangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      evt => {
        const { protocol } = evt;
      }
    );

    return () => {
      unsubscribe();
    };
  }, [hangingProtocolService]);

  useEffect(() => {
    window.addEventListener('click', closeOnOutsideClick);
    return () => {
      window.removeEventListener('click', closeOnOutsideClick);
    };
  }, [isOpen]);

  const onInteractionHandler = () => setIsOpen(!isOpen);
  const DropdownContent = isOpen ? OHIFLayoutSelector : null;

  const onSelectionHandler = props => {
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
  };

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
            onSelection={onSelectionHandler}
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

export default LayoutSelector;
