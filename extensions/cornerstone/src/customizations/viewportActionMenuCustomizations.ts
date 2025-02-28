import viewportActionCornersService from '../services/ViewportActionCornersService/ViewportActionCornersService';
import { WindowLevelActionMenu } from '../components/WindowLevelActionMenu/WindowLevelActionMenu';

export default {
  'viewportActionMenu.windowLevelActionMenu': {
    enabled: true,
    location: viewportActionCornersService.LOCATIONS.topRight,
    component: WindowLevelActionMenu,
  },
  'viewportActionMenu.segmentationOverlay': {
    enabled: true,
    location: viewportActionCornersService.LOCATIONS.topRight,
  },
};
