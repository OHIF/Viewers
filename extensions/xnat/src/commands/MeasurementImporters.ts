/**
 * Measurement import utilities
 * Extracted from measurementCommands.ts
 */

import MeasurementImportMenu from '../xnat-components/XNATMeasurementImportMenu/XNATMeasurementImportMenu';

export interface MeasurementImporterParams {
  UIModalService: any;
  viewportGridService: any;
  displaySetService: any;
  uiNotificationService: any;
}

/**
 * Imports measurements from XNAT using a modal interface
 */
export async function XNATImportMeasurements(
  { UIModalService, viewportGridService, displaySetService, uiNotificationService }: MeasurementImporterParams,
  { servicesManager, commandsManager }: { servicesManager: any; commandsManager: any }
) {
  const { activeViewportId, viewports } = viewportGridService.getState();

  if (!activeViewportId) {
    uiNotificationService.show({
      title: 'Import Measurements',
      message: 'No active viewport found.',
      type: 'error',
    });
    return;
  }

  const activeViewport = viewports.get(activeViewportId);
  const displaySetInstanceUID = activeViewport.displaySetInstanceUIDs[0];
  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
  const { StudyInstanceUID: studyInstanceUID, SeriesInstanceUID: seriesInstanceUID } = displaySet;

  UIModalService.show({
    content: MeasurementImportMenu,
    title: 'Import Measurements from XNAT',
    contentProps: {
      studyInstanceUID,
      seriesInstanceUID,
      servicesManager,
      commandsManager,
      onClose: UIModalService.hide,
    },
  });
}
