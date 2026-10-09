import type { Types as OhifTypes } from '@ohif/core';

/**
 * Loads a display set's data, for display sets that carry their own load
 * operation (SEG, RTSTRUCT, PMAP, SR, PDF, video, ...).
 *
 * This is the viewport-independent half of getting a derived display set onto
 * the screen. It fetches and decodes the data and registers the result - for a
 * segmentation, that means the segmentation exists in the segmentation state -
 * and it neither knows nor needs to know which viewport, if any, is going to
 * display it. Choosing where the result is shown, and adding a representation
 * to a viewport, is a separate viewport-scoped step.
 *
 * Keeping the two apart is what allows the decision about which overlays belong
 * in which viewports to be made somewhere other than viewport assembly, without
 * that decision having to drive loading as a side effect.
 *
 * The underlying `load` is memoized per display set and returns the same
 * in-flight promise to every caller, so calling this repeatedly, concurrently,
 * or earlier than the viewport that will show the result is safe and costs
 * nothing after the first call.
 *
 * A load failure is reported to the user and otherwise swallowed: a display set
 * that cannot be loaded must not stop whatever requested it from completing.
 */
export async function loadDisplaySetData(
  displaySet: OhifTypes.DisplaySet,
  servicesManager: AppTypes.ServicesManager
): Promise<void> {
  if (!(displaySet?.load instanceof Function)) {
    return;
  }

  const { userAuthenticationService, uiNotificationService } = servicesManager.services;
  const headers = userAuthenticationService.getAuthorizationHeader();

  try {
    await displaySet.load({ headers });
  } catch (e) {
    uiNotificationService.show({
      title: 'Error loading displaySet',
      message: e.message,
      type: 'error',
    });
    console.error(e);
  }
}

export default loadDisplaySetData;
