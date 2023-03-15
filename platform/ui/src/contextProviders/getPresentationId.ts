/**
 * Selects a presentation ID to use for this viewport.
 * This is done to allow the same display set to be displayed more than once
 * on screen, with different attributes such as window level and initial position.
 * Then, when redisplaying that, the nearest/most common attribute is re-used.
 *
 * For example, for display set <displaySetUID>, in a viewport of type volume,
 * the generated presentationID might be
 * `volume:axial:<displaySetUID>`.  This can then be used to store and retrieve
 * presentation information in state sync service 'presentationSync' state.
 *
 * The generated value attempts to generate a unique value for every type
 * of viewport which should have it's own presentation information.  Thus, the
 * following values are used for presentation ID:
 *
 * 1. viewportType - since the presentation information for a volume is different than for a stack
 * 2. orientation - since the camera is different for different orientations
 * 3. display set instance UID - since different display sets should get displayed differently
 * 4. instance count - since displaying the same series twice should allow applying different window level etc
 *
 * @param viewport requiring a presentation Id
 * @param viewports is the list of viewports being shown.  Any presentation ID's
 *         among them must not be re-used in order to have each viewport have it's own presentation ID.
 * @returns Presentation ID id, or undefined if nothing displayed
 */
const getPresentationId = (viewport, viewports): string => {
  if (!viewport) return;
  const { viewportOptions, displaySetInstanceUIDs } = viewport;
  if (!viewportOptions || !displaySetInstanceUIDs?.length) {
    console.log('No viewport type or display sets in', viewport);
    return;
  }

  const viewportType = viewportOptions.viewportType || 'stack';
  const idArr = [viewportType, 0, ...displaySetInstanceUIDs];
  if (viewportOptions.orientation) {
    idArr.splice(2, 0, viewportOptions.orientation);
  }

  // Allow setting a custom presentation prefix in the hanging protocol
  // This allows defining new
  // presentation groups to be set automatically when one knows that the
  // same display set will be displayed in different ways.
  // This is the recommended way to manage a hanging protocol which displays
  // multiple views of a single display set, eg to display brain, bone, soft
  // tissue views in different viewports.
  if (viewportOptions.presentationPrefix) {
    idArr.push(viewportOptions.presentationPrefix);
  }
  if (!viewports) {
    console.log('viewports not defined', idArr.join(','));
    return idArr.join('&');
  }

  // This code finds the first unique index to add to the presentation id so that
  // two viewports containing the same display set in the same type of viewport
  // can have different presentation information.  This allows comparison of
  // a single display set in two or more viewports, when the user has simply
  // dragged and dropped the view in twice.  For example, it allows displaying
  // bone, brain and soft tissue views of a single display set, and to still
  // remember the specific changes to each viewport.
  for (let displayInstance = 0; displayInstance < 128; displayInstance++) {
    idArr[1] = displayInstance;
    const testId = idArr.join('&');
    if (!viewports.find(it => it.viewportOptions?.presentationId === testId)) {
      break;
    }
  }
  const id = idArr.join('&');
  return id;
};

export default getPresentationId;
