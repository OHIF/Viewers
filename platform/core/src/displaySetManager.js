class DisplaySetManager {
  constructor() {
    this.displaySets = [];
  }

  init(extensionManager, SOPClassHandlerIds, viewModelContext) {
    this.extensionManager = extensionManager;
    this.SOPClassHandlerIds = SOPClassHandlerIds;

    const {
      displaySetInstanceUids,
      setDisplaySetInstanceUids,
    } = viewModelContext;

    this.displaySetInstanceUids = displaySetInstanceUids;
    this.setDisplaySetInstanceUids = setDisplaySetInstanceUids;

    // Reset displaySetInstanceUids
    this.setDisplaySetInstanceUids([]);
  }

  _addDisplaySets(displaySets) {
    //const displayInstanceUids = [...this.displaySetInstanceUids];

    const addedDisplaySetUids = [];

    displaySets.forEach(displaySet => {
      this.displaySets.push(displaySet);

      addedDisplaySetUids.push(displaySet.displaySetInstanceUid);
    });

    return addedDisplaySetUids;
  }

  getDisplaySetsForSeries(SeriesInstanceUID) {
    return this.displaySets.filter(
      displaySet => displaySet.SeriesInstanceUID === SeriesInstanceUID
    );
  }

  getDisplaySetByUID(displaySetInstanceUid) {
    return this.displaySets.find(
      displaySet => displaySet.displaySetInstanceUid === displaySetInstanceUid
    );
  }

  makeDisplaySets = instances => {
    if (!instances || !instances.length) {
      throw new Error('No instances were provided.');
    }

    const instance = instances[0];

    const existingDisplaySets =
      this.getDisplaySetsForSeries(instance.SeriesInstanceUID) || [];

    const SOPClassHandlerIds = this.SOPClassHandlerIds;

    for (let i = 0; i < SOPClassHandlerIds.length; i++) {
      const SOPClassHandlerId = SOPClassHandlerIds[i];
      const handler = this.extensionManager.getModuleEntry(SOPClassHandlerId);

      if (handler.sopClassUids.includes(instance.SOPClassUID)) {
        let addedDisplaySetUids;

        // Check if displaySets are already created using this SeriesInstanceUID/SOPClassHandler pair.
        const cachedDisplaySets = existingDisplaySets.filter(
          displaySet => displaySet.SOPClassHandlerId === SOPClassHandlerId
        );

        if (cachedDisplaySets.length) {
          addedDisplaySetUids = cachedDisplaySets.map(
            displaySet => displaySet.displaySetInstanceUid
          );
        } else {
          const displaySets = handler.getDisplaySetsFromSeries(instances);

          addedDisplaySetUids = this._addDisplaySets(displaySets);
        }

        this.displaySetInstanceUids = [
          ...addedDisplaySetUids,
          ...this.displaySetInstanceUids,
        ];

        this.setDisplaySetInstanceUids(this.displaySetInstanceUids);
      }
    }
  };
}

const displaySetManager = new DisplaySetManager();

export default displaySetManager;
