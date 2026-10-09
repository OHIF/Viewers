import type { Types } from '@ohif/core';
import { isDisplaySetOverlayable } from './isDisplaySetOverlayable';
import { isAutoHydrateViewportType } from './autoHydrateViewportTypes';

/**
 * After SEG hydration we must refresh every viewport that shows the referenced volume so
 * presentations (including segmentation) apply to all MPR/3D tiles. Hanging-protocol matching
 * can return only the active viewport when protocol definitions omit viewportId (e.g. 3D four-up)
 * or when layout state diverges from the protocol; this merges in all grid panes that already
 * list that volume in `displaySetInstanceUIDs`, plus every pane whose background the derived
 * display set may be drawn over (`isDisplaySetOverlayable`, i.e. same frame of reference).
 *
 * The frame-of-reference merge is what makes hydration mean "show it wherever it logically
 * belongs" rather than "show it where the exact referenced UID happens to be hung": a pane built
 * from a different display set of the same data (a multi-frame split, a reconstruction) is a
 * legitimate place to show the segmentation, and the segmentation presentation store is keyed by
 * frame of reference so the lookup in those panes resolves.
 */
function mergeMatchingViewports(
  hangingProtocolUpdates: Types.HangingProtocol.ViewportUpdate[] | null | undefined,
  volumeUid: string | undefined,
  viewports: AppTypes.ViewportGrid.Viewports,
  isEligiblePane?: (viewport: AppTypes.ViewportGrid.Viewport) => boolean
): Types.HangingProtocol.ViewportUpdate[] {
  if (!volumeUid && !isEligiblePane) {
    return (hangingProtocolUpdates ?? []) as Types.HangingProtocol.ViewportUpdate[];
  }

  const byId = new Map<string, Types.HangingProtocol.ViewportUpdate>();

  const add = (viewportId: string, uids: string[]) => {
    if (!viewportId || !uids?.length) {
      return;
    }
    byId.set(viewportId, { viewportId, displaySetInstanceUIDs: uids });
  };

  if (Array.isArray(hangingProtocolUpdates)) {
    for (const entry of hangingProtocolUpdates) {
      const vid = entry.viewportId ?? entry.viewportOptions?.viewportId;
      if (vid) {
        add(vid, entry.displaySetInstanceUIDs?.length ? entry.displaySetInstanceUIDs : [volumeUid]);
      }
    }
  }

  viewports.forEach(vp => {
    // The hanging-protocol pass ran first and is authoritative for the panes it names - it is the
    // one that knows the referenced display set has to be *loaded* into the hydration target,
    // whose current display sets are exactly what hydration is replacing. Overwriting its entry
    // with the pane's existing UIDs would discard that instruction.
    if (byId.has(vp.viewportId)) {
      return;
    }

    const uids = vp.displaySetInstanceUIDs || [];

    // Only exact displaySetInstanceUID matches force the referenced volume onto the pane; a pane
    // that merely shares the frame of reference keeps the display sets it already has (forcing a
    // different UID onto a volume viewport can leave it blank).
    if (volumeUid && uids.includes(volumeUid)) {
      add(vp.viewportId, [volumeUid]);
      return;
    }

    if (isEligiblePane?.(vp)) {
      add(vp.viewportId, uids);
    }
  });

  const merged = Array.from(byId.values());

  if (
    merged.length === 0 &&
    Array.isArray(hangingProtocolUpdates) &&
    hangingProtocolUpdates.length > 0
  ) {
    return hangingProtocolUpdates;
  }

  return merged;
}

/**
 * Builds a predicate saying whether a grid pane is a standard place to show the given derived
 * display set: its background must be something the segmentation can be drawn over, and its
 * viewport type must be one automatic hydration is allowed into.
 *
 * Returns undefined when there is no derived display set to reason about, so callers fall back to
 * exact-UID matching alone.
 */
function makeEligiblePanePredicate({
  derivedDisplaySetInstanceUID,
  servicesManager,
}: {
  derivedDisplaySetInstanceUID?: string;
  servicesManager: AppTypes.ServicesManager;
}) {
  const { displaySetService, customizationService } = servicesManager.services;

  const derivedDisplaySet = derivedDisplaySetInstanceUID
    ? displaySetService.getDisplaySetByUID(derivedDisplaySetInstanceUID)
    : undefined;

  if (!derivedDisplaySet) {
    return undefined;
  }

  return (viewport: AppTypes.ViewportGrid.Viewport) => {
    if (
      !isAutoHydrateViewportType({
        viewportType: viewport?.viewportOptions?.viewportType,
        customizationService,
      })
    ) {
      return false;
    }

    const backgroundUid = (viewport?.displaySetInstanceUIDs || []).find(uid => {
      const ds = displaySetService.getDisplaySetByUID(uid);
      return ds && !ds.isOverlayDisplaySet;
    });

    if (!backgroundUid) {
      return false;
    }

    return isDisplaySetOverlayable({
      displaySet: derivedDisplaySet,
      backgroundDisplaySet: displaySetService.getDisplaySetByUID(backgroundUid),
    });
  };
}

function getUpdatedViewportsForSegmentation({
  viewportId,
  servicesManager,
  displaySetInstanceUIDs,
  derivedDisplaySetInstanceUID,
}: withAppTypes) {
  const { hangingProtocolService, viewportGridService } = servicesManager.services;

  const { isHangingProtocolLayout, viewports } = viewportGridService.getState();

  const isEligiblePane = makeEligiblePanePredicate({
    derivedDisplaySetInstanceUID: derivedDisplaySetInstanceUID as string | undefined,
    servicesManager,
  });

  // The target viewport may be gone (the layout changed while the hydration prompt was open, and
  // promptHydrationDialog resolves after a user click and a setTimeout) or may never have existed
  // (hydration driven from the study panel with nothing showing the referenced series). Hydration
  // is a statement about the display set, not about a viewport, so a missing one is not fatal -
  // fall through to eligibility matching instead of dereferencing it.
  const viewport = getTargetViewport({ viewportId, viewportGridService });
  const targetViewportId = viewport?.viewportOptions?.viewportId;

  const updatedViewports = targetViewportId
    ? hangingProtocolService.getViewportsRequireUpdate(
        targetViewportId,
        displaySetInstanceUIDs[0],
        isHangingProtocolLayout
      )
    : null;

  if (!isHangingProtocolLayout) {
    // Outside a hanging protocol layout the protocol match is authoritative when there is one;
    // eligibility matching only fills in when there was nothing to match against.
    if (updatedViewports?.length) {
      return updatedViewports;
    }

    return mergeMatchingViewports(null, undefined, viewports, isEligiblePane);
  }

  if (updatedViewports == null && !isEligiblePane) {
    return updatedViewports;
  }

  return mergeMatchingViewports(
    updatedViewports,
    displaySetInstanceUIDs[0],
    viewports,
    isEligiblePane
  );
}

const getTargetViewport = ({ viewportId, viewportGridService }) => {
  const { viewports, activeViewportId } = viewportGridService.getState();
  const targetViewportId = viewportId || activeViewportId;

  const viewport = viewports.get(targetViewportId);

  return viewport;
};

export { getUpdatedViewportsForSegmentation };
