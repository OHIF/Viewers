import { getWindowLevelActionMenu } from '../components/WindowLevelActionMenu/getWindowLevelActionMenu';
import { getViewportDataOverlaySettingsMenu } from '../components/ViewportDataOverlaySettingMenu';
import { getViewportOrientationMenu } from '../components/ViewportOrientationMenu';
import { AllInOneMenu, ViewportActionCorners } from '@ohif/ui-next';

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
      id: 'orientationMenu',
      component: createOrientationMenu,
    },
    {
      id: 'dataOverlayMenu',
      component: createDataOverlay,
    },
  ],
  'viewportActionMenu.topRight': [],
  'viewportActionMenu.bottomLeft': [
    {
      id: 'windowLevelActionMenu',
      component: createWindowLevelMenu,
    },
  ],
  'viewportActionMenu.bottomRight': [],
};
