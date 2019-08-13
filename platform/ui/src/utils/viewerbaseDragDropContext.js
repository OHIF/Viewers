import { DragDropContext } from 'react-dnd';
import TouchBackend from 'react-dnd-touch-backend';

// See https://github.com/react-dnd/react-dnd/issues/186#issuecomment-335429067
// https://github.com/react-dnd/react-dnd/issues/186#issuecomment-282789420
// TODO: Find a way for this context to be used in the parent application as well.

// http://react-dnd.github.io/react-dnd/docs/api/drag-drop-context
export default function viewerbaseDragDropContext(DecoratedClass) {
  return DragDropContext(TouchBackend({ enableMouseEvents: true }), null, true)(
    DecoratedClass
  );
}
