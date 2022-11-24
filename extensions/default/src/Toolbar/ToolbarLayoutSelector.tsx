import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  LayoutSelector as OHIFLayoutSelector,
  ToolbarButton,
  useViewportGrid,
} from '@ohif/ui';

function LayoutSelector({ rows, columns, servicesManager }) {
  const [isOpen, setIsOpen] = useState(false);
  const [disableSelector, setDisableSelector] = useState(false);
  const [viewportGridState, viewportGridService] = useViewportGrid();

  const { HangingProtocolService } = servicesManager.services;

  const closeOnOutsideClick = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const { unsubscribe } = HangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      evt => {
        const { protocol } = evt;

        if (protocol.id === 'mpr') {
          setDisableSelector(true);
        } else {
          setDisableSelector(false);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [HangingProtocolService]);

  useEffect(() => {
    window.addEventListener('click', closeOnOutsideClick);
    return () => {
      window.removeEventListener('click', closeOnOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    /* Reset to default layout when component unmounts */
    return () => {
      viewportGridService.setLayout({ numCols: 1, numRows: 1 });
    };
  }, []);

  const onInteractionHandler = () => setIsOpen(!isOpen);
  const DropdownContent = isOpen ? OHIFLayoutSelector : null;

  return (
    <ToolbarButton
      id="Layout"
      label="Grid Layout"
      icon="tool-layout"
      onInteraction={onInteractionHandler}
      dropdownContent={
        DropdownContent !== null && (
          <DropdownContent
            rows={rows}
            columns={columns}
            onSelection={({ numRows, numCols }) => {
              viewportGridService.setLayout({ numRows, numCols });
            }}
          />
        )
      }
      isActive={disableSelector ? false : isOpen}
      type="toggle"
    />
  );
}

LayoutSelector.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
  onLayoutChange: PropTypes.func,
};

LayoutSelector.defaultProps = {
  rows: 3,
  columns: 3,
  onLayoutChange: () => {},
};

export default LayoutSelector;
