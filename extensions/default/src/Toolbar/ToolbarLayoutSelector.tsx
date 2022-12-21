import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  LayoutSelector as OHIFLayoutSelector,
  ToolbarButton,
  useViewportGrid,
} from '@ohif/ui';

function LayoutSelector({ rows, columns, className, servicesManager }) {
  const [isOpen, setIsOpen] = useState(false);
  const [disableSelector, setDisableSelector] = useState(false);
  const [viewportGridState, viewportGridService] = useViewportGrid();

  const { HangingProtocolService, ToolBarService } = servicesManager.services;

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
      className={className}
      dropdownContent={
        DropdownContent !== null && (
          <DropdownContent
            rows={rows}
            columns={columns}
            onSelection={({ numRows, numCols }) => {
              if (
                HangingProtocolService.getActiveProtocol().protocol.id === 'mpr'
              ) {
                ToolBarService.recordInteraction({
                  groupId: 'MPR',
                  itemId: 'MPR',
                  interactionType: 'toggle',
                  commands: [
                    {
                      commandName: 'toggleMPR',
                      commandOptions: {},
                      context: 'CORNERSTONE',
                    },
                  ],
                });
              }

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
