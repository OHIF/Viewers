import { getWindowLevelActionMenu } from '../components/WindowLevelActionMenu/getWindowLevelActionMenu';
import { getViewportDataOverlaySettingsMenu } from '../components/ViewportDataOverlaySettingMenu';
import { getViewportOrientationMenu } from '../components/ViewportOrientationMenu';
import { AllInOneMenu } from '@ohif/ui-next';

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
    verticalDirection: AllInOneMenu.VerticalDirection.TopToBottom,
    horizontalDirection: AllInOneMenu.HorizontalDirection.LeftToRight,
  });
};

export default {
  'viewportActionMenu.topLeft': [
    {
      id: 'orientationMenu',
      enabled: true,
      component: createOrientationMenu,
    },
    {
      id: 'dataOverlay',
      enabled: true,
      component: createDataOverlay,
    },
    {
      id: 'windowLevelActionMenu',
      enabled: true,
      component: createWindowLevelMenu,
    },
  ],
  'viewportActionMenu.topRight': [],
  'viewportActionMenu.bottomLeft': [],
  'viewportActionMenu.bottomRight': [],
};
