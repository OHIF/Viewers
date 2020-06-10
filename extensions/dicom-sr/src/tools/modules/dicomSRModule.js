import cornerstone from 'cornerstone-core';

const state = {
  TrackingUniqueIdentifier: null,
  trackingIdentifiersByEnabledElementUUID: {},
};

function setTrackingUniqueIdentifiersForElement(
  element,
  trackingUniqueIdentifiers,
  activeIndex = 0
) {
  const enabledElement = cornerstone.getEnabledElement(element);
  const { uuid } = enabledElement;

  state.trackingIdentifiersByEnabledElementUUID[uuid] = {
    trackingUniqueIdentifiers,
    activeIndex,
  };
}

function setActiveTrackingUniqueIdentifierForElement(
  element,
  TrackingUniqueIdentifier
) {
  const enabledElement = cornerstone.getEnabledElement(element);
  const { uuid } = enabledElement;

  const trackingIdentifiersForElement =
    state.trackingIdentifiersByEnabledElementUUID[uuid];

  if (trackingIdentifiersForElement) {
    const activeIndex = trackingIdentifiersForElement.trackingUniqueIdentifiers.findIndex(
      tuid => tuid === TrackingUniqueIdentifier
    );

    trackingIdentifiersForElement.activeIndex = activeIndex;
  }
}

function getTrackingUniqueIdentifiersForElement(element) {
  const enabledElement = cornerstone.getEnabledElement(element);
  const { uuid } = enabledElement;

  if (state.trackingIdentifiersByEnabledElementUUID[uuid]) {
    return state.trackingIdentifiersByEnabledElementUUID[uuid];
  }

  return { trackingUniqueIdentifiers: [] };
}

export default {
  state,
  getters: {
    trackingUniqueIdentifiersForElement: getTrackingUniqueIdentifiersForElement,
  },
  setters: {
    trackingUniqueIdentifiersForElement: setTrackingUniqueIdentifiersForElement,
    activeTrackingUniqueIdentifierForElement: setActiveTrackingUniqueIdentifierForElement,
  },
};
