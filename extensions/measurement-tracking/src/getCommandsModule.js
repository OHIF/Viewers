// SEE:
// https://github.com/OHIF/Viewers/blob/b58aa4575ab72fe3f493cc5a4261b4f8256516ab/platform/viewer/src/appExtensions/MeasurementsPanel/index.js#L18-L49
import React from 'react';
import { useViewportGrid } from '@ohif/ui';

function getCommandsModule({ servicesManager }) {
  const { UIDialogService } = servicesManager.services;

  const definitions = {
    toggleLayoutSelectionDialog: {
      commandFn: () => {
        if (!UIDialogService) {
          window.alert(
            'Unable to show dialog; no UI Dialog Service available.'
          );
          return;
        }

        // TODO: use SimpleDialog component
        // TODO: update position on window resize
        // TODO: Expand service API to check if dialog w/ ID is already open
        // TODO: Import and call `useViewportGrid`
        UIDialogService.dismiss({ id: 'layoutSelection' });
        UIDialogService.create({
          id: 'layoutSelection',
          centralize: true,
          isDraggable: false,
          showOverlay: true,
          content: Test,
        });
      },
      storeContexts: [],
      options: {},
      context: 'VIEWER',
    },
  };

  return {
    definitions,
    defaultContext: 'VIEWER',
  };
}

function Test() {
  const [
    { numCols, numRows, activeViewportIndex, viewports },
    dispatch,
  ] = useViewportGrid();

  return (
    <div
      onClick={() => {
        dispatch({
          type: 'SET_LAYOUT',
          payload: {
            numCols: 2,
            numRows: 2,
          },
        });
      }}
      style={{ color: 'white' }}
    >
      Hello World!
    </div>
  );
}

export default getCommandsModule;
