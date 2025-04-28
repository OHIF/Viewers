import viewportActionCornersService from '../services/ViewportActionCornersService/ViewportActionCornersService';
import { WindowLevelActionMenu } from '../components/WindowLevelActionMenu/WindowLevelActionMenu';

export default {
  'viewportActionMenu.orientationMenu': {
    enabled: true,
    location: viewportActionCornersService.LOCATIONS.topLeft,
    indexPriority: 1, // First/highest priority
  },
  'viewportActionMenu.dataOverlay': {
    enabled: true,
    location: viewportActionCornersService.LOCATIONS.topLeft,
    indexPriority: 2, // Second priority
  },
  'viewportActionMenu.windowLevelActionMenu': {
    enabled: true,
    location: viewportActionCornersService.LOCATIONS.topLeft,
    indexPriority: 3, // Third/lowest priority
    component: WindowLevelActionMenu,
  },
};
