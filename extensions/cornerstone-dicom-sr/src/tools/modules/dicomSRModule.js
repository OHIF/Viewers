import { getEnabledElement } from '@cornerstonejs/core';

const state = {
  TrackingUniqueIdentifier: null,
  trackingIdentifiersByViewportId: {},
};

/**
 * This file is being used to store the per-viewport state of the SR tools,
 * Since, all the toolStates are added to the cornerstoneTools, when displaying the SRTools,
 * if there are two viewports rendering the same imageId, we don't want to show
 * the same SR annotation twice on irrelevant viewport, hence, we are storing the state
 * of the SR tools in state here, so that we can filter them later.
 */

function setTrackingUniqueIdentifiersForElement(
  element,
  trackingUniqueIdentifiers,
  activeIndex = 0
) {
  const enabledElement = getEnabledElement(element);
  const { viewport } = enabledElement;

  state.trackingIdentifiersByViewportId[viewport.id] = {
    trackingUniqueIdentifiers,
    activeIndex,
  };
}

function setActiveTrackingUniqueIdentifierForElement(element, TrackingUniqueIdentifier) {
  const enabledElement = getEnabledElement(element);
  const { viewport } = enabledElement;

  const trackingIdentifiersForElement = state.trackingIdentifiersByViewportId[viewport.id];

  if (trackingIdentifiersForElement) {
    const activeIndex = trackingIdentifiersForElement.trackingUniqueIdentifiers.findIndex(
      tuid => tuid === TrackingUniqueIdentifier
    );

    trackingIdentifiersForElement.activeIndex = activeIndex;
  }
}

function getTrackingUniqueIdentifiersForElement(element) {
  const enabledElement = getEnabledElement(element);
  const { viewport } = enabledElement;

  if (state.trackingIdentifiersByViewportId[viewport.id]) {
    return state.trackingIdentifiersByViewportId[viewport.id];
  }

  return { trackingUniqueIdentifiers: [] };
}

export {
  setTrackingUniqueIdentifiersForElement,
  setActiveTrackingUniqueIdentifierForElement,
  getTrackingUniqueIdentifiersForElement,
};
