import React from 'react';
import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// import TouchBackend from 'react-dnd-touch-backend';

// TODO: this is false when it should not be :thinking:
const isTouchDevice =
  typeof window !== `undefined` && !!('ontouchstart' in window || navigator.maxTouchPoints);

/**
 * Relevant:
 * https://github.com/react-dnd/react-dnd/issues/186#issuecomment-335429067
 * https://github.com/react-dnd/react-dnd/issues/186#issuecomment-282789420
 *
 * Docs:
 * http://react-dnd.github.io/react-dnd/docs/api/drag-drop-context
 */
function DragAndDropProvider({ children }) {
  const backend = HTML5Backend; // isTouchDevice ? TouchBackend : HTML5Backend;
  const opts = {}; // isTouchDevice ? { enableMouseEvents: true } : {};

  console.log('using... touch backend?', isTouchDevice);

  return (
    <DndProvider
      backend={backend}
      opts={opts}
    >
      {children}
    </DndProvider>
  );
}

DragAndDropProvider.propTypes = {
  children: PropTypes.any,
};

export default DragAndDropProvider;
