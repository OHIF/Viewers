import { utilities as csUtils } from '@cornerstonejs/core';

/**
 * Modalities that are drawn by a segmentation representation rather than being
 * blended in as a second volume.
 */
export const DERIVED_OVERLAY_MODALITIES = ['SEG', 'RTSTRUCT'];

/**
 * Decides whether `displaySet` can be shown on top of `backgroundDisplaySet`.
 *
 * This is the single eligibility rule shared by the two places that need it:
 *
 *  - the viewport data overlay menu, which asks it about one viewport's current
 *    background (see `getEnhancedDisplaySets`), and
 *  - hydration, which asks it about candidate backgrounds across the study and
 *    must be able to do so with no viewport in existence at all.
 *
 * It therefore takes display sets rather than a viewportId. Hydration is a
 * statement about a display set ("show this wherever it logically belongs"), so
 * anything it depends on has to be answerable from display sets alone.
 */
export function isDisplaySetOverlayable({
  displaySet,
  backgroundDisplaySet,
}: {
  displaySet;
  backgroundDisplaySet;
}): boolean {
  if (!displaySet || !backgroundDisplaySet) {
    return false;
  }

  if (displaySet.displaySetInstanceUID === backgroundDisplaySet.displaySetInstanceUID) {
    return false;
  }

  if (displaySet.unsupported) {
    return false;
  }

  // The frames of reference must agree when the candidate declares one. A
  // candidate without one is not rejected here: not every overlayable display
  // set carries a frame of reference.
  if (
    displaySet.FrameOfReferenceUID &&
    displaySet.FrameOfReferenceUID !== backgroundDisplaySet.FrameOfReferenceUID
  ) {
    return false;
  }

  if (DERIVED_OVERLAY_MODALITIES.includes(displaySet.Modality)) {
    // The display set the overlay was made against always qualifies. Note it is
    // not required to be reconstructable: an RTSTRUCT over a stack is exactly
    // the case `getHydrationViewportTypeForModality` pins to 'stack' on
    // hydrate, so the reconstructable gate below must not apply here.
    if (displaySet.referencedDisplaySetInstanceUID === backgroundDisplaySet.displaySetInstanceUID) {
      return true;
    }

    // Beyond that display set, the frames of reference matching (checked above)
    // is only meaningful when both sides are reconstructable volumes: the
    // segmentation is then defined in world coordinates over that frame, so any
    // co-registered volume in it is a legitimate place to draw it. Two display
    // sets can share a frame of reference while being unrelated series, and a
    // stack's data is bound to specific images, so a non-reconstructable side
    // gets no reach past its own display set.
    //
    // A derived display set copies isReconstructable and FrameOfReferenceUID
    // from the display set it references, so both are answers about the
    // reference (see cornerstone-dicom-seg/getSopClassHandlerModule).
    return Boolean(
      displaySet.isReconstructable &&
        displaySet.FrameOfReferenceUID &&
        backgroundDisplaySet.isReconstructable
    );
  }

  // A colormap overlay is blended in as a second volume, so both sides have to
  // be valid volumes.
  if (!backgroundDisplaySet.isReconstructable) {
    return false;
  }

  if (!csUtils.isValidVolume(backgroundDisplaySet.imageIds || [])) {
    return false;
  }

  const imageIds = displaySet.imageIds || displaySet.images?.map(image => image.imageId);

  if (!displaySet.isMultiFrame && imageIds?.length > 0 && !csUtils.isValidVolume(imageIds)) {
    return false;
  }

  return true;
}
