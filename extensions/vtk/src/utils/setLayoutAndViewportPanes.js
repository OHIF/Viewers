import { redux } from '@ohif/core';

const { setLayoutAndViewportPanes } = redux.actions;

// TODO: Should not be getting dispatch from the window, but I'm not sure how else to do it cleanly
export default function setLayout({ numRows, numColumns, viewportPanes }) {
  const action = setLayoutAndViewportPanes({
    numRows,
    numColumns,
    viewportPanes,
  });

  window.store.dispatch(action);
}
