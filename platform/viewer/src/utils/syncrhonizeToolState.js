import { getItem, setItem } from '../lib/localStorageUtils';
import store from '../store';
import { BrainMode } from './constants';

export const handleRestoreToolState = (
  cornerstone,
  enabledElement,
  studyInstanceUID,
  resize = false
) => {
  let tool_data = localStorage.getItem(studyInstanceUID);
  tool_data =
    tool_data && tool_data !== 'undefined' ? JSON.parse(tool_data) : null;

  if (enabledElement && tool_data) {
    let viewport = cornerstone.getViewport(enabledElement);
    if (tool_data.x) viewport.translation.x = tool_data.x;
    if (tool_data.y) viewport.translation.y = tool_data.y;
    if (tool_data.scale) viewport.scale = tool_data.scale;
    if (tool_data.voi) viewport.voi = tool_data.voi;

    if (resize) cornerstone.fitToWindow(enabledElement);
    if (resize) cornerstone.resize(enabledElement, true);

    console.log('handleRestoreToolState::update::viewport', {
      viewport,
    });

    cornerstone.setViewport(enabledElement, viewport);
    // console.log('handleRestoreToolState::update::viewport', {
    //   viewport,
    // });

    setItem('restoreToolStateRan', true); // 1 means true
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
      console.log('handleRestoreToolState::reset::viewport', {
        viewport,
      });
    }
    setItem('restoreToolStateRan', true); // 1 means true
  }

  setItem('canSave', 1);
};

export const handleSaveToolState = (studyInstanceUID, viewport) => {
  const restoreToolStateRan = getItem('restoreToolStateRan', true); // 1 means true

  console.log('handleSaveToolState', {
    studyInstanceUID,
    restoreToolStateRan,
    viewport,
  });
  if (!restoreToolStateRan) return;
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
