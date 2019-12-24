import { redux } from '@ohif/core';

const { setViewportLayoutAndData } = redux.actions;

// TODO: Should not be getting dispatch from the window, but I'm not sure how else to do it cleanly
export default function setLayoutAndViewportData(layout, viewportSpecificData) {
  const action = setViewportLayoutAndData(layout, viewportSpecificData);

  window.store.dispatch(action);
}
