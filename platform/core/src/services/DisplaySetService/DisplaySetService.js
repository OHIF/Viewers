import pubSubServiceInterface from '../pubSubServiceInterface';

const EVENTS = {
  DISPLAY_SETS_ADDED: 'event::displaySetService:displaySetsAdded',
};

const displaySetCache = [];

export default class DisplaySetService {
  constructor() {
    this.displaySets = {};
    this.EVENTS = EVENTS;
    this.listeners = {};

    Object.assign(this, pubSubServiceInterface);
  }

  init(extensionManager, SOPClassHandlerIds) {
    this.extensionManager = extensionManager;
    this.SOPClassHandlerIds = SOPClassHandlerIds;
    this.activeDisplaySets = [];
  }

  _addDisplaySetsToCache(displaySets) {
    displaySets.forEach(displaySet => {
      displaySetCache.push(displaySet);
    });
  }

  _addActiveDisplaySets(displaySets) {
    const activeDisplaySets = this.activeDisplaySets;

    displaySets.forEach(displaySet => {
      activeDisplaySets.push(displaySet);
    });
  }

  getActiveDisplaySets() {
    return this.activeDisplaySets;
  }

  getDisplaySetsForSeries = SeriesInstanceUID => {
    return displaySetCache.filter(
      displaySet => displaySet.SeriesInstanceUID === SeriesInstanceUID
    );
  };

  getDisplaySetByUID = displaySetInstanceUid => {
    // TODO: Why is this searching active, not just displaySets?
    return displaySetCache.find(
      displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUid
    );
  };

  /**
   * Broadcasts displaySetService changes.
   *
   * @param {string} eventName The event name
   * @return void
   */
  _broadcastChange = (eventName, callbackProps) => {
    const hasListeners = Object.keys(this.listeners).length > 0;
    const hasCallbacks = Array.isArray(this.listeners[eventName]);

    if (hasListeners && hasCallbacks) {
      this.listeners[eventName].forEach(listener => {
        listener.callback(callbackProps);
      });
    }
  };

  makeDisplaySets = (input, batch = false) => {
    if (!input || !input.length) {
      throw new Error('No instances were provided.');
    }

    if (batch && !input[0].length) {
      throw new Error(
        'Batch displaySet creation does not contain array of array of instances.'
      );
    }

    // If array of instances => One instance.
    let displaySetsAdded = [];

    if (batch) {
      input.forEach(instances => {
        const displaySets = this.makeDisplaySetForInstances(instances);

        displaySetsAdded = [...displaySetsAdded, displaySets];
      });
    } else {
      const displaySets = this.makeDisplaySetForInstances(input);

      displaySetsAdded = displaySets;
    }

    // If array of array of instances
    if (displaySetsAdded && displaySetsAdded.length) {
      this._broadcastChange(EVENTS.DISPLAY_SETS_ADDED, displaySetsAdded);
    }
  };

  makeDisplaySetForInstances(instances) {
    const instance = instances[0];

    const existingDisplaySets =
      this.getDisplaySetsForSeries(instance.SeriesInstanceUID) || [];

    const SOPClassHandlerIds = this.SOPClassHandlerIds;

    for (let i = 0; i < SOPClassHandlerIds.length; i++) {
      const SOPClassHandlerId = SOPClassHandlerIds[i];
      const handler = this.extensionManager.getModuleEntry(SOPClassHandlerId);

      if (handler.sopClassUids.includes(instance.SOPClassUID)) {
        // Check if displaySets are already created using this SeriesInstanceUID/SOPClassHandler pair.
        let displaySets = existingDisplaySets.filter(
          displaySet => displaySet.SOPClassHandlerId === SOPClassHandlerId
        );

        if (displaySets.length) {
          this._addActiveDisplaySets(displaySets);
        } else {
          displaySets = handler.getDisplaySetsFromSeries(instances);

          this._addDisplaySetsToCache(displaySets);
          this._addActiveDisplaySets(displaySets);
        }

        return displaySets;
      }
    }
  }
}
