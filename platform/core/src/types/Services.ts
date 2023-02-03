import {
  HangingProtocolService,
  CustomizationService,
  MeasurementService,
  ViewportGridService,
  ToolbarService,
} from '../services';

/**
 * The interface for the services object
 */
export default interface Services {
  hangingProtocolService?: HangingProtocolService;
  customizationService?: CustomizationService;
  measurementService?: MeasurementService;
  DisplaySetService?: Record<string, unknown>;
  CineService?: Record<string, unknown>;
  toolbarService?: ToolbarService;
  CornerstoneViewportService?: Record<string, unknown>;
  UIDialogService?: Record<string, unknown>;
  ToolGroupService?: Record<string, unknown>;
  UINotificationService?: Record<string, unknown>;
  viewportGridService?: ViewportGridService;
  SyncGroupService?: Record<string, unknown>;
  CornerstoneCacheService?: Record<string, unknown>;
}
