import { dicomMetadataStore } from '@ohif/core';

export default class SOPClassHandlerManager {
  constructor(extensionManager, sopClassHandlerIds) {
    this.SOPClassHandlers = sopClassHandlerIds.map(
      extensionManager.getModuleEntry
    );

    dicomMetadataStore.onSeriesMetadataLoaded(this.onSeriesMetadataLoaded);

    // TODO, this is unclear. How are we getting the created display sets out?
    this.displaySets = [];
  }

  onSeriesMetadataLoaded = instances => {
    if (!instances || !instances.length) {
      throw new Error("No instances were provided.");
    }

    const SOPClassHandlers = this.SOPClassHandlers;

    for (let i = 0; i < SOPClassHandlers.length; i++) {
      const handler = SOPClassHandlers[i];

      if (handler.sopClassUids.includes(instances[0].SOPClassUID)) {
        // TODO: This step is still unclear to me
        this.displaySets = handler.getDisplaySetFromSeries(instances).map(a => a.displaySetInstanceUid);
      }
    }
  };
}
