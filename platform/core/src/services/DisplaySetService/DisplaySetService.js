import pubSubServiceInterface from '../_shared/pubSubServiceInterface';
import EVENTS from './EVENTS';

const displaySetCache = [];

export default class DisplaySetService {
  constructor() {
    this.displaySets = {};
    this.listeners = {};
    this.EVENTS = EVENTS;

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

  /**
   * @param {string} displaySetInstanceUID
   * @returns {object} displaySet
   */
  getDisplaySetByUID = displaySetInstanceUid =>
    displaySetCache.find(
      displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUid
    );

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

    if (displaySetsAdded && displaySetsAdded.length) {
      this._broadcastEvent(EVENTS.DISPLAY_SETS_ADDED, displaySetsAdded);

      this._broadcastEvent(EVENTS.DISPLAY_SETS_CHANGED, this.activeDisplaySets);
    }
  };

  hasDisplaySetsForStudy(StudyInstanceUID) {
    return displaySetCache.some(
      displaySet => displaySet.StudyInstanceUID === StudyInstanceUID
    );
  }

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
