import { dicomMetadataStore } from '@ohif/core';

export default class SOPClassHandlerManager {
  constructor(extensionManager, sopClassHandlerIds) {
    this.SOPClassHandlers = sopClassHandlerIds.map(
      extensionManager.getModuleEntry
    );

    dicomMetadataStore.listen(this.onSeriesMetadataLoaded);
  }

  onSeriesMetadataLoaded = instances => {
    const SOPClassHandlers = this.SOPClassHandlers;

    for (let i = 0; i < SOPClassHandlers.length; i++) {
      const handler = SOPClassHandlers[i];

      if (handler.sopClassUids.includes(instances[0].SOPClassUID)) {
        // TODO: This step is still unclear to me
        return handler.getDisplaySetFromSeries(series);
      }
    }
  };
}
