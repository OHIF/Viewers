import guid from '../../utils/guid';

const EVENTS = {
  DISPLAY_SET_ADDED: 'event::displaySetService:displaySetAdded',
};

const displaySetCache = [];

export default class DisplaySetService {
  constructor() {
    this.displaySets = {};
    this.EVENTS = EVENTS;
    this.listeners = {};
  }

  init(extensionManager, SOPClassHandlerIds) {
    this.extensionManager = extensionManager;
    this.SOPClassHandlerIds = SOPClassHandlerIds;
    this.activeDisplaySets = {};
  }

  /**
   * Subscribe to measurement updates.
   *
   * @param {string} eventName The name of the event
   * @param {Function} callback Events callback
   * @return {Object} Observable object with actions
   */
  subscribe(eventName, callback) {
    debugger;
    if (this._isValidEvent(eventName)) {
      const listenerId = guid();
      const subscription = { id: listenerId, callback };

      console.info(`displaySetService: Subscribing to '${eventName}'.`);
      if (Array.isArray(this.listeners[eventName])) {
        this.listeners[eventName].push(subscription);
      } else {
        this.listeners[eventName] = [subscription];
      }

      return {
        unsubscribe: () => this._unsubscribe(eventName, listenerId),
      };
    } else {
      throw new Error(`Event ${eventName} not supported.`);
    }
  }

  /**
   * Unsubscribe to measurement updates.
   *
   * @param {string} eventName The name of the event
   * @param {string} listenerId The listeners id
   * @return void
   */
  _unsubscribe(eventName, listenerId) {
    if (!this.listeners[eventName]) {
      return;
    }

    const listeners = this.listeners[eventName];
    if (Array.isArray(listeners)) {
      this.listeners[eventName] = listeners.filter(
        ({ id }) => id !== listenerId
      );
    } else {
      this.listeners[eventName] = undefined;
    }
  }

  /**
   * Broadcasts displaySetService changes.
   *
   * @param {string} eventName The event name
   * @return void
   */
  _broadcastChange(eventName) {
    const hasListeners = Object.keys(this.listeners).length > 0;
    const hasCallbacks = Array.isArray(this.listeners[eventName]);

    if (hasListeners && hasCallbacks) {
      this.listeners[eventName].forEach(listener => {
        listener.callback(this.activeDisplaySets);
      });
    }
  }

  /**
   * Check if a given displaySetService event is valid.
   *
   * @param {string} eventName The name of the event
   * @return {boolean} Event name validation
   */
  _isValidEvent(eventName) {
    return Object.values(this.EVENTS).includes(eventName);
  }

  _addDisplaySetsToCache(displaySets) {
    displaySets.forEach(displaySet => {
      displaySetCache.push(displaySet);
    });
  }

  _addActiveDisplaySets(displaySets) {
    const activeDisplaySets = this.activeDisplaySets;

    displaySets.forEach(displaySet => {
      const { StudyInstanceUID } = displaySet;

      if (!Array.isArray(activeDisplaySets[StudyInstanceUID])) {
        activeDisplaySets[StudyInstanceUID] = [];
      }

      activeDisplaySets[StudyInstanceUID].push(displaySet);
    });

    console.log('DISPLAY_SET_ADDED');
    console.log(activeDisplaySets);

    this._broadcastChange(EVENTS.DISPLAY_SET_ADDED);
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
    return this.displaySets.find(
      displaySet => displaySet.displaySetInstanceUid === displaySetInstanceUid
    );
  };

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
        // Check if displaySets are already created using this SeriesInstanceUID/SOPClassHandler pair.
        const cachedDisplaySets = existingDisplaySets.filter(
          displaySet => displaySet.SOPClassHandlerId === SOPClassHandlerId
        );

        if (cachedDisplaySets.length) {
          this._addActiveDisplaySets(cachedDisplaySets);
        } else {
          const newDisplaySets = handler.getDisplaySetsFromSeries(instances);

          this._addDisplaySetsToCache(newDisplaySets);
          this._addActiveDisplaySets(newDisplaySets);
        }
      }
    }
  };
}
