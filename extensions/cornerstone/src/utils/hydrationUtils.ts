/**
 * After SEG hydration we must refresh every viewport that shows the referenced volume so
 * presentations (including segmentation) apply to all MPR/3D tiles. Hanging-protocol matching
 * can return only the active viewport when protocol definitions omit viewportId (e.g. 3D four-up)
 * or when layout state diverges from the protocol; this merges in all grid panes that already
 * list that volume in `displaySetInstanceUIDs`.
 *
 * Only exact displaySetInstanceUID matches are used (no Frame-of-Reference inference): sibling
 * MPR planes must already share the same referenced volume UID in grid state, or HP matching
 * must list them; otherwise forcing a different UID onto a volume viewport can leave it blank.
 */
function mergeVolumeSharingViewports(
  hangingProtocolUpdates: unknown[] | null | undefined,
  volumeUid: string | undefined,
  viewports: AppTypes.ViewportGrid.GridViewports
): Array<{ viewportId: string; displaySetInstanceUIDs: string[] }> {
  if (!volumeUid) {
    return (hangingProtocolUpdates ?? []) as Array<{ viewportId: string; displaySetInstanceUIDs: string[] }>;
  }

  const byId = new Map<string, { viewportId: string; displaySetInstanceUIDs: string[] }>();

  const add = (viewportId: string, uids: string[]) => {
    if (!viewportId) {
      return;
    }
    byId.set(viewportId, { viewportId, displaySetInstanceUIDs: uids });
  };

  if (Array.isArray(hangingProtocolUpdates)) {
    for (const u of hangingProtocolUpdates) {
      const entry = u as {
        viewportId?: string;
        viewportOptions?: { viewportId?: string };
        displaySetInstanceUIDs?: string[];
      };
      const vid = entry.viewportId ?? entry.viewportOptions?.viewportId;
      if (vid) {
        add(vid, entry.displaySetInstanceUIDs?.length ? entry.displaySetInstanceUIDs : [volumeUid]);
      }
    }
  }

  viewports.forEach(vp => {
    const uids = vp.displaySetInstanceUIDs || [];
    if (uids.includes(volumeUid)) {
      add(vp.viewportId, [volumeUid]);
    }
  });

  const merged = Array.from(byId.values());

  if (
    merged.length === 0 &&
    Array.isArray(hangingProtocolUpdates) &&
    hangingProtocolUpdates.length > 0
  ) {
    return hangingProtocolUpdates as Array<{ viewportId: string; displaySetInstanceUIDs: string[] }>;
  }

  return merged;
}

function getUpdatedViewportsForSegmentation({
  viewportId,
  servicesManager,
  displaySetInstanceUIDs,
}: withAppTypes) {
  const { hangingProtocolService, viewportGridService } = servicesManager.services;

  const { isHangingProtocolLayout, viewports } = viewportGridService.getState();

  const viewport = getTargetViewport({ viewportId, viewportGridService });
  const targetViewportId = viewport.viewportOptions.viewportId;

  const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
    targetViewportId,
    displaySetInstanceUIDs[0],
    isHangingProtocolLayout
  );

  if (updatedViewports == null) {
    return updatedViewports;
  }

  return mergeVolumeSharingViewports(updatedViewports, displaySetInstanceUIDs[0], viewports);
}

const getTargetViewport = ({ viewportId, viewportGridService }) => {
  const { viewports, activeViewportId } = viewportGridService.getState();
  const targetViewportId = viewportId || activeViewportId;

  const viewport = viewports.get(targetViewportId);

  return viewport;
};

export { getUpdatedViewportsForSegmentation };
