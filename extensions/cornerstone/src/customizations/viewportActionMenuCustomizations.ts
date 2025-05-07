import { getWindowLevelActionMenu } from '../components/WindowLevelActionMenu/getWindowLevelActionMenu';
import { getViewportDataOverlaySettingsMenu } from '../components/ViewportDataOverlaySettingMenu';
import { getViewportOrientationMenu } from '../components/ViewportOrientationMenu';
import { AllInOneMenu, ViewportActionCorners } from '@ohif/ui-next';
import { MENU_IDS } from '../components/menus/menu-ids';

// Generate component renderer functions for each component type
const createOrientationMenu = ({ viewportId, element, location }) => {
  return getViewportOrientationMenu({
    viewportId,
    element,
    location,
  });
};

const createDataOverlay = ({ viewportId, element, displaySets, location }) => {
  return getViewportDataOverlaySettingsMenu({
    viewportId,
    element,
    displaySets,
    location,
  });
};

const createWindowLevelMenu = ({ viewportId, element, displaySets }) => {
  return getWindowLevelActionMenu({
    viewportId,
    element,
    displaySets,
    verticalDirection: AllInOneMenu.VerticalDirection.BottomToTop,
    horizontalDirection: AllInOneMenu.HorizontalDirection.LeftToRight,
  });
};

export default {
  'ui.viewportActionCorner': ViewportActionCorners,
  'viewportActionMenu.topLeft': [
    {
      id: MENU_IDS.ORIENTATION_MENU,
      component: createOrientationMenu,
    },
    {
      id: MENU_IDS.DATA_OVERLAY_MENU,
      component: createDataOverlay,
    },
  ],
  'viewportActionMenu.topRight': [],
  'viewportActionMenu.bottomLeft': [
    {
      id: MENU_IDS.WINDOW_LEVEL_MENU,
      component: createWindowLevelMenu,
    },
  ],
  'viewportActionMenu.bottomRight': [],
};
