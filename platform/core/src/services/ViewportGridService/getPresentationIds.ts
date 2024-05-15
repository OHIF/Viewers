const JOIN_STR = '&';

// The default lut presentation id if none defined
const DEFAULT = 'default';

// This code finds the first unique index to add to the presentation id so that
// two viewports containing the same display set in the same type of viewport
// can have different presentation information.  This allows comparison of
// a single display set in two or more viewports, when the user has simply
// dragged and dropped the view in twice.  For example, it allows displaying
// bone, brain and soft tissue views of a single display set, and to still
// remember the specific changes to each viewport.
const addUniqueIndex = (arr, key, viewports, isUpdatingSameViewport) => {
  arr.push(0);

  // If we are updating the viewport, we should not increment the index
  if (isUpdatingSameViewport) {
    return;
  }

  // The 128 is just a value that is larger than how many viewports we
  // display at once, used as an upper bound on how many unique presentation
  // ID's might exist for a single display set at once.
  for (let displayInstance = 0; displayInstance < 128; displayInstance++) {
    arr[arr.length - 1] = displayInstance;
    const testId = arr.join(JOIN_STR);
    if (
      !Array.from(viewports.values()).find(
        viewport => viewport.viewportOptions?.presentationIds?.[key] === testId
      )
    ) {
      break;
    }
  }
};

const getLutId = (ds): string => {
  if (!ds || !ds.options) {
    return DEFAULT;
  }
  if (ds.options.id) {
    return ds.options.id;
  }
  const arr = Object.entries(ds.options).map(([key, val]) => `${key}=${val}`);
  if (!arr.length) {
    return DEFAULT;
  }
  return arr.join(JOIN_STR);
};

export type PresentationIds = {
  positionPresentationId?: string;
  lutPresentationId?: string;
};

/**
 * Gets a set of presentation IDs for a viewport.  The presentation IDs are
 * used to remember the presentation state of the viewport when it is navigated
 * to different layouts.
 *
 * The design of this is setup to allow preserving the view information in the
 * following cases:
 *
 *
 *      * If a set of display sets was previously displayed in the same initial
 *        position as it is currently being asked to be displayed,
 *        then remember the camera position as previously displayed
 *
 *      * If a set of display sets was previously displayed with the same initial
 *        LUT conditions, then remember the last LUT displayed for that display set
 *        and re-apply it.
 *
 *      * Otherwise, apply the initial hanging protocol specified LUT and camera
 *        position to new display sets.
 *
 * This means generating two presentationId keys:
 *
 *  `positionPresentationId`
 *
 *  Used for getting the camera/initial position state sync values.
 *  This is a combination of:
 *      * `viewportOptions.id`
 *      * `viewportOptions.orientation`
 *      * display set UID's - as displayed for this viewport, excluding seg
 *      * a unique index number if the previous key is already displayed
 *
 * `lutPresentationId`
 *
 * Used for getting the voi LUT information.  Generated from:
 *
 *       * `displaySetOption[0].options` - including the id if present
 *       * displaySetUID's
 *       * a unique index number if the previously generated key is already
 *         displayed.
 *
 * @param viewport requiring a presentation Id
 * @param viewports is the list of viewports being shown.  Any presentation ID's
 *         among them must not be re-used in order to have each viewport have it's own presentation ID.
 * @returns PresentationIds
 */
const getPresentationIds = (viewport, viewports): PresentationIds => {
  if (!viewport) {
    return;
  }
  const { viewportOptions, displaySetInstanceUIDs, displaySetOptions } = viewport;
  if (!viewportOptions || !displaySetInstanceUIDs?.length) {
    return;
  }

  const { id, orientation } = viewportOptions;
  const lutId = getLutId(displaySetOptions[0]);
  const lutPresentationArr = [lutId];

  const positionPresentationArr = [orientation || 'acquisition'];
  if (id) {
    positionPresentationArr.push(id);
  }

  if (displaySetOptions.some(ds => ds.options?.blendMode || ds.options?.displayPreset)) {
    positionPresentationArr.push(`custom`);
  }

  for (const uid of displaySetInstanceUIDs) {
    positionPresentationArr.push(uid);
    lutPresentationArr.push(uid);
  }

  // only add unique index if the viewport is getting inserted and not updated
  const isUpdatingSameViewport = Array.from(viewports.values()).some(v => {
    return (
      v.displaySetInstanceUIDs?.toString() === viewport.displaySetInstanceUIDs?.toString() &&
      v.viewportId === viewport.viewportId
    );
  });

  // if it is updating the viewport we should not increment the index since
  // it might be a layer on the fusion or a SEG layer that is added on
  // top of the original display set
  addUniqueIndex(
    positionPresentationArr,
    'positionPresentationId',
    viewports,
    isUpdatingSameViewport
  );
  addUniqueIndex(lutPresentationArr, 'lutPresentationId', viewports, isUpdatingSameViewport);

  const lutPresentationId = lutPresentationArr.join(JOIN_STR);
  const positionPresentationId = positionPresentationArr.join(JOIN_STR);
  return { lutPresentationId, positionPresentationId };
};

export default getPresentationIds;
export { getPresentationIds };
