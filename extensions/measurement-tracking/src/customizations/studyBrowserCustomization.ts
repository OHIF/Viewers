import { measurementTrackingMode } from '../contexts/TrackedMeasurementsContext/promptBeginTracking';

type CheckHasDirtyAndSimplifiedModeProps = {
  servicesManager: AppTypes.ServicesManager;
  appConfig: AppTypes.Config;
  displaySetInstanceUID: string;
};

const onDoubleClickHandler = {
  callbacks: [
    ({ activeViewportId, servicesManager, isHangingProtocolLayout, appConfig }) =>
      async displaySetInstanceUID => {
        const { hangingProtocolService, viewportGridService, uiNotificationService } =
          servicesManager.services;
        let updatedViewports = [];
        const viewportId = activeViewportId;
        const haveDirtyMeasurementsInSimplifiedMode = checkHasDirtyAndSimplifiedMode({
          servicesManager,
          appConfig,
          displaySetInstanceUID,
        });

        try {
          if (!haveDirtyMeasurementsInSimplifiedMode) {
            updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
              viewportId,
              displaySetInstanceUID,
              isHangingProtocolLayout
            );
            viewportGridService.setDisplaySetsForViewports(updatedViewports);
          }
        } catch (error) {
          console.warn(error);
          uiNotificationService.show({
            title: 'Thumbnail Double Click',
            message: 'The selected display sets could not be added to the viewport.',
            type: 'error',
            duration: 3000,
          });
        }
      },
  ],
};

const customOnDropHandlerCallback = async props => {
  const handled = checkHasDirtyAndSimplifiedMode(props);
  return Promise.resolve({ handled });
};

const checkHasDirtyAndSimplifiedMode = (props: CheckHasDirtyAndSimplifiedModeProps) => {
  const { servicesManager, appConfig, displaySetInstanceUID } = props;
  const simplifiedMode = appConfig.measurementTrackingMode === measurementTrackingMode.SIMPLIFIED;
  const { measurementService, displaySetService } = servicesManager.services;
  const measurements = measurementService.getMeasurements();
  const haveDirtyMeasurements =
    measurements.some(m => m.isDirty) ||
    (measurements.length && measurementService.getIsMeasurementDeletedIndividually());
  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
  const hasDirtyAndSimplifiedMode =
    displaySet.Modality === 'SR' && simplifiedMode && haveDirtyMeasurements;
  return hasDirtyAndSimplifiedMode;
};

export { onDoubleClickHandler, customOnDropHandlerCallback };
