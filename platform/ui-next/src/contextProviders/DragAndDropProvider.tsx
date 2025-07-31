import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// import TouchBackend from 'react-dnd-touch-backend';

// TODO: this is false when it should not be :thinking:
const isTouchDevice =
  typeof window !== `undefined` && !!('ontouchstart' in window || navigator.maxTouchPoints);

interface DragAndDropProviderProps {
  children?: any;
}

/**
 * Relevant:
 * https://github.com/react-dnd/react-dnd/issues/186#issuecomment-335429067
 * https://github.com/react-dnd/react-dnd/issues/186#issuecomment-282789420
 *
 * Docs:
 * http://react-dnd.github.io/react-dnd/docs/api/drag-drop-context
 */
function DragAndDropProvider({
  children
}: DragAndDropProviderProps) {
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

export default DragAndDropProvider;
