import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  LayoutSelector as OHIFLayoutSelector,
  ToolbarButton,
  useViewportGrid,
} from '@ohif/ui';

import { ServicesManager } from '@ohif/core';

function LayoutSelector({
  rows,
  columns,
  className,
  servicesManager,
  ...rest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [disableSelector, setDisableSelector] = useState(false);
  const [viewportGridState, viewportGridService] = useViewportGrid();

  const {
    hangingProtocolService,
    toolbarService,
  } = (servicesManager as ServicesManager).services;

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

  useEffect(() => {
    /* Reset to default layout when component unmounts */
    return () => {
      viewportGridService.setLayout({ numCols: 1, numRows: 1 });
    };
  }, []);

  const onInteractionHandler = () => setIsOpen(!isOpen);
  const DropdownContent = isOpen ? OHIFLayoutSelector : null;

  const onSelectionHandler = ({ numRows, numCols }) => {
    // TODO Introduce a service to persist the state of the current hanging protocol/app.

    // TODO Here the layout change will amount to a change of hanging protocol as specified by the extension for this layout selector tool
    // followed by the change of the grid itself.
    if (hangingProtocolService.getActiveProtocol().protocol.id === 'mpr') {
      toolbarService.recordInteraction({
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

    // When a new layout is selected, keep any extra/offscreen viewports
    // so that if any of those viewports were populated via the UI then they
    // will be maintained in case those viewports are redisplayed later.
    viewportGridService.setLayout({
      numRows,
      numCols,
      keepExtraViewports: true,
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
      isActive={disableSelector ? false : isOpen}
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
