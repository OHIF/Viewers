import { useEffect, useState } from 'react';
import { eventTarget, utilities as csUtilities } from '@cornerstonejs/core';
import { Enums as csToolsEnums } from '@cornerstonejs/tools';

const { DefaultHistoryMemo } = csUtilities.HistoryMemo;

// Cornerstone events after which the undo/redo history may have changed.
// `undo`/`redo` emit the HISTORY_* events, but any tool action that records a
// memo (drawing an annotation, editing a labelmap, deleting an annotation)
// pushes onto the history WITHOUT emitting a history event, so we also listen
// for the tool events that produce those memos in order to keep the enabled
// state of the buttons in sync.
const HISTORY_CHANGING_EVENTS = [
  csToolsEnums.Events.HISTORY_UNDO,
  csToolsEnums.Events.HISTORY_REDO,
  csToolsEnums.Events.ANNOTATION_COMPLETED,
  csToolsEnums.Events.ANNOTATION_REMOVED,
  csToolsEnums.Events.SEGMENTATION_DATA_MODIFIED,
];

/**
 * Tracks whether an undo/redo is currently available so the header buttons can
 * be disabled (greyed out) when there is nothing to undo/redo.
 */
export function useUndoRedoState(): { canUndo: boolean; canRedo: boolean } {
  const [state, setState] = useState(() => ({
    canUndo: DefaultHistoryMemo.canUndo,
    canRedo: DefaultHistoryMemo.canRedo,
  }));

  useEffect(() => {
    // A memo is often pushed synchronously *after* the triggering event is
    // dispatched, so defer the read until the current call stack unwinds to
    // make sure we observe the up-to-date availability.
    let scheduled: ReturnType<typeof setTimeout> | null = null;

    const readState = () => {
      scheduled = null;
      setState(prev => {
        const { canUndo, canRedo } = DefaultHistoryMemo;
        return prev.canUndo === canUndo && prev.canRedo === canRedo ? prev : { canUndo, canRedo };
      });
    };

    const schedule = () => {
      if (scheduled === null) {
        scheduled = setTimeout(readState, 0);
      }
    };

    HISTORY_CHANGING_EVENTS.forEach(evt => eventTarget.addEventListener(evt, schedule));

    // Sync once on mount in case the history already has content.
    readState();

    return () => {
      HISTORY_CHANGING_EVENTS.forEach(evt => eventTarget.removeEventListener(evt, schedule));
      if (scheduled !== null) {
        clearTimeout(scheduled);
      }
    };
  }, []);

  return state;
}

export default useUndoRedoState;
