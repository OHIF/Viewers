import { hydrateStructuredReport as baseHydrateStructuredReport } from '@ohif/extension-cornerstone-dicom-sr';

function hydrateStructuredReport({ servicesManager, extensionManager }, ctx, evt) {
  const { displaySetService } = servicesManager.services;
  const { viewportId, displaySetInstanceUID } = evt;
  const srDisplaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  return new Promise((resolve, reject) => {
    const hydrationResult = baseHydrateStructuredReport(
      { servicesManager, extensionManager },
      displaySetInstanceUID
    );

    const StudyInstanceUID = hydrationResult.StudyInstanceUID;
    const SeriesInstanceUIDs = hydrationResult.SeriesInstanceUIDs;

    resolve({
      displaySetInstanceUID: evt.displaySetInstanceUID,
      srSeriesInstanceUID: srDisplaySet.SeriesInstanceUID,
      viewportId,
      StudyInstanceUID,
      SeriesInstanceUIDs,
    });
  });
}

export default hydrateStructuredReport;
