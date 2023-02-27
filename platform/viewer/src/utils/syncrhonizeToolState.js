import store from '../store';

export const handleRestoreToolState = (
  cornerstone,
  enabledElement,
  studyInstanceUID
) => {
  let tool_data = localStorage.getItem(studyInstanceUID);
  tool_data =
    tool_data && tool_data !== 'undefined' ? JSON.parse(tool_data) : {};
  if (enabledElement && tool_data) {
    let viewport = cornerstone.getViewport(enabledElement);
    if (tool_data.x) viewport.translation.x = tool_data.x;
    if (tool_data.y) viewport.translation.y = tool_data.y;
    if (tool_data.scale) viewport.scale = tool_data.scale;
    if (tool_data.voi) viewport.voi = tool_data.voi;

    // cornerstone.resize(enabledElement, true);
    cornerstone.setViewport(enabledElement, viewport);
    // cornerstone.fitToWindow(enabledElement);
  } else {
    const state = store.getState();
    const preset = state.mode.active === BrainMode ? 5 : 2;
    const { preferences = {} } = state;
    const { window, level } =
      preferences.windowLevelData && preferences.windowLevelData[preset];

    if (enabledElement) {
      let viewport = cornerstone.getViewport(enabledElement);
      viewport.voi = {
        windowWidth: Number(window),
        windowCenter: Number(level),
      };
      cornerstone.setViewport(enabledElement, viewport);
    }
  }
};

export const handleSaveToolState = (studyInstanceUID, viewport) => {
  localStorage.setItem(
    studyInstanceUID,
    JSON.stringify({
      voi: viewport.voi,
      scale: viewport.scale,
      x: viewport.translation.x,
      y: viewport.translation.y,
    })
  );
};
