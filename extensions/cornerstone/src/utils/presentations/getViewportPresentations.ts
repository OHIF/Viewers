import { usePositionPresentationStore } from '../../stores/usePositionPresentationStore';
import { useLutPresentationStore } from '../../stores/useLutPresentationStore';
import { useSegmentationPresentationStore } from '../../stores/useSegmentationPresentationStore';
import { isDisplaySetOverlayable } from '../isDisplaySetOverlayable';
import type { SegmentationPresentation } from '../../types/Presentation';

/**
 * Collects the segmentation presentation items that apply to this viewport.
 *
 * The store is keyed by the exact display set a segmentation was hydrated
 * against, because two display sets can share a frame of reference while being
 * unrelated series - so the frame of reference cannot be a key. But which
 * viewports a hydrated segmentation belongs in is a relation, not a key: it is
 * `isDisplaySetOverlayable`, which lets a segmentation over a reconstructable
 * volume also apply to other co-registered volumes in the same frame of
 * reference. So the keyed lookup is followed by a scan of the remaining entries
 * for items that are overlayable on this viewport's background.
 *
 * The keyed entry wins on conflict: it is the segmentation's own display set,
 * so its recorded type and hydration state are the authoritative ones.
 *
 * Provisional shape: this reads the store imperatively via getState() and
 * rescans on every setViewportData, which is cheap today (one entry per
 * referenced display set) but is not a hash lookup any more. The intended
 * direction is a zustand store with selectors, so the relation is expressed as
 * a memoized selector over the presentation state rather than a scan here.
 */
function getSegmentationPresentation({
  segmentationPresentationId,
  segmentationPresentationStore,
  displaySets,
  displaySetService,
}): SegmentationPresentation | null {
  const keyed = segmentationPresentationStore[segmentationPresentationId];

  const backgroundDisplaySet = displaySets?.find(displaySet => !displaySet?.isOverlayDisplaySet);

  if (!backgroundDisplaySet || !displaySetService) {
    return keyed ?? null;
  }

  const bySegmentationId = new Map();
  // The segmentationIds bySegmentationId holds the referenced display set's own
  // entry for.
  const fromReferencedKey = new Set();

  for (const [key, items] of Object.entries(segmentationPresentationStore)) {
    if (key === segmentationPresentationId) {
      continue;
    }

    for (const item of (items as SegmentationPresentation) ?? []) {
      const derivedDisplaySet = displaySetService.getDisplaySetByUID(item.segmentationId);

      if (
        !derivedDisplaySet ||
        !isDisplaySetOverlayable({ displaySet: derivedDisplaySet, backgroundDisplaySet })
      ) {
        continue;
      }

      // More than one key can carry an entry for the same segmentation once it
      // reaches co-registered panes: the referenced display set's own key holds
      // the hydration statement, while every other pane it is merely rendered
      // in writes a bookkeeping `hydrated: null` through
      // syncSegmentationPresentation. Object.entries order must not decide
      // which of those a third pane resolves against - a null winning here
      // would silently leave the segmentation out of that pane. So prefer the
      // referenced display set's entry, then any entry that states a hydration
      // at all.
      const isReferencedKey = key === derivedDisplaySet.referencedDisplaySetInstanceUID;
      const existing = bySegmentationId.get(item.segmentationId);

      if (
        existing &&
        !isReferencedKey &&
        (fromReferencedKey.has(item.segmentationId) || item.hydrated == null)
      ) {
        continue;
      }

      if (isReferencedKey) {
        fromReferencedKey.add(item.segmentationId);
      }

      bySegmentationId.set(item.segmentationId, item);
    }
  }

  for (const item of keyed ?? []) {
    const related = bySegmentationId.get(item.segmentationId);

    // The keyed entry wins on type/config, but `hydrated: null` is "no
    // statement", not "not hydrated" - storePresentation writes exactly that
    // for every pane a segmentation is merely *rendered* in, since hydration is
    // owned by the referenced display set's own entry. Letting it overwrite an
    // explicit hydration would erase the relation after one store/restore
    // cycle, and the segmentation would silently vanish from the co-registered
    // panes it reached through this scan.
    const hydrated = item.hydrated == null && related ? related.hydrated : item.hydrated;

    bySegmentationId.set(item.segmentationId, { ...item, hydrated });
  }

  if (!bySegmentationId.size) {
    return keyed ?? null;
  }

  return Array.from(bySegmentationId.values());
}

export function getViewportPresentations(
  viewportId: string,
  viewportOptions: AppTypes.ViewportGrid.GridViewportOptions,
  displaySets?: AppTypes.DisplaySet[],
  displaySetService?: AppTypes.DisplaySetService
) {
  const { lutPresentationStore } = useLutPresentationStore.getState();
  const { positionPresentationStore } = usePositionPresentationStore.getState();
  const { segmentationPresentationStore } = useSegmentationPresentationStore.getState();

  // NOTE: this is the new viewport state, we should not get the presentationIds from the cornerstoneViewportService
  // since that has the old viewport state
  const { presentationIds } = viewportOptions;

  if (!presentationIds) {
    return {
      positionPresentation: null,
      lutPresentation: null,
      segmentationPresentation: null,
    };
  }

  const { lutPresentationId, positionPresentationId, segmentationPresentationId } = presentationIds;

  const positionPresentation = positionPresentationStore[positionPresentationId];
  const lutPresentation = lutPresentationStore[lutPresentationId];

  const segmentationPresentation = getSegmentationPresentation({
    segmentationPresentationId,
    segmentationPresentationStore,
    displaySets,
    displaySetService,
  });

  return {
    positionPresentation,
    lutPresentation,
    segmentationPresentation,
  };
}
