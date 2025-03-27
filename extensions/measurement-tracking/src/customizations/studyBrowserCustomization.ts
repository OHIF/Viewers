import { measurementTrackingMode } from '../contexts/TrackedMeasurementsContext/promptBeginTracking';

export default {
  callbacks: [
    ({ activeViewportId, servicesManager, isHangingProtocolLayout, appConfig }) =>
      async displaySetInstanceUID => {
        const {
          hangingProtocolService,
          viewportGridService,
          uiNotificationService,
          displaySetService,
          measurementService,
        } = servicesManager.services;
        let updatedViewports = [];
        const viewportId = activeViewportId;
        const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
        const simplifiedMode =
          appConfig.measurementTrackingMode === measurementTrackingMode.SIMPLIFIED;
        const measurements = measurementService.getMeasurements();
        const haveDirtyMeasurements = measurements.some(m => m.isDirty);
        const haveDirtyMeasurementsInSimplifiedMode =
          displaySet.Modality === 'SR' && simplifiedMode && haveDirtyMeasurements;
        try {
          if (!haveDirtyMeasurementsInSimplifiedMode) {
            updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
              viewportId,
              displaySetInstanceUID,
              isHangingProtocolLayout
            );
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
        viewportGridService.setDisplaySetsForViewports(updatedViewports);
      },
  ],
};
