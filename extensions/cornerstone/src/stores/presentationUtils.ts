const JOIN_STR = '&';

// The default lut presentation id if none defined
const DEFAULT_STR = 'default';

// This code finds the first unique index to add to the presentation id so that
// two viewports containing the same display set in the same type of viewport
// can have different presentation information.  This allows comparison of
// a single display set in two or more viewports, when the user has simply
// dragged and dropped the view in twice.  For example, it allows displaying
// bone, brain and soft tissue views of a single display set, and to still
// remember the specific changes to each viewport.
const addUniqueIndex = (
  arr,
  key,
  viewports: AppTypes.ViewportGrid.Viewports,
  isUpdatingSameViewport
) => {
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

export { addUniqueIndex, DEFAULT_STR, JOIN_STR };
