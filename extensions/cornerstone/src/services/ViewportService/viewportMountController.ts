import type { Types } from '@ohif/core';

import { getViewportPresentations } from '../../utils/presentations/getViewportPresentations';
import type { StackViewportData, VolumeViewportData } from '../../types/CornerstoneCacheService';
import type { Presentations } from '../../types/Presentation';

const STACK = 'stack';

/**
 * The viewport mount controller (plan section 4.6, mount-intent variant): owns
 * the data-mount orchestration that used to live in OHIFCornerstoneViewport's
 * loadViewportData effect, keyed on an explicit mount intent instead of React
 * prop diffing.
 *
 * The intent contract exists because the SEG/SR/RT/PMAP/tracked wrappers render
 * OHIFCornerstoneViewport with TRANSFORMED displaySets/viewportOptions (eg the
 * referenced series instead of the SEG the grid composition names). The mount
 * inputs therefore must come from the component's received props - published
 * here as an intent - never from the raw grid composition.
 */

export interface ViewportMountIntent {
  displaySets: AppTypes.DisplaySet[];
  viewportOptions: AppTypes.ViewportGrid.GridViewportOptions;
  displaySetOptions: unknown[];
  /**
   * Compared by REFERENCE in compareMountIntent (the old areEqual ignored it
   * entirely). Because the intent is republished on every render, custom
   * viewport wrappers must pass a referentially stable dataSource (eg the
   * mode-level instance); constructing one inline per render would supersede
   * and remount the viewport on every render.
   */
  dataSource: unknown;
  initialImageIndex?: number;
  /** The grid composition revision the publishing render observed. */
  compositionRevision: number;
}

// Structural view of ViewportInfo; only what the invalidation fan-out reads.
type ViewportInfoLike = {
  hasDisplaySet: (displaySetInstanceUID: string) => boolean;
  getViewportData: () => StackViewportData | VolumeViewportData;
};

export interface ViewportMountControllerArgs {
  servicesManager: AppTypes.ServicesManager;
  setViewportData: (
    viewportId: string,
    viewportData: StackViewportData | VolumeViewportData,
    publicViewportOptions: AppTypes.ViewportGrid.GridViewportOptions,
    publicDisplaySetOptions: unknown[],
    presentations?: Presentations
  ) => void;
  updateViewport: (viewportId: string, viewportData: unknown, keepCamera?: boolean) => void;
  getViewportInfo: (viewportId: string) => ViewportInfoLike | undefined;
}

export interface ViewportMountController {
  /** Registers the DOM element; mounts any pending intent for the viewport. */
  attachElement: (viewportId: string, element: HTMLDivElement) => void;
  /** Cancels any in-flight mount and forces a remount on a future re-attach. */
  detachElement: (viewportId: string) => void;
  /**
   * Publishes the mount inputs for a viewport. Safe to call on every render:
   * compareMountIntent dedupes, so equal republishes no-op.
   */
  setMountIntent: (viewportId: string, intent: ViewportMountIntent) => void;
  destroy: () => void;
}

/**
 * Returns true when the two intents describe the same mount (no remount
 * needed). Transliterated from the old OHIFCornerstoneViewport React.memo
 * areEqual comparator, extended ONLY with compositionRevision (which replaces
 * both needsRerendering escape hatches) plus the two extra mount inputs the
 * old effect depended on (dataSource identity, initialImageIndex). Fields the
 * old comparator ignored stay ignored (equal-by-definition).
 *
 * Contract change vs the old comparator, relevant to extension authors: the
 * dataSource is compared by reference (see ViewportMountIntent.dataSource)
 * and an initialImageIndex change now remounts where the old memo suppressed
 * it.
 */
export function compareMountIntent(prev: ViewportMountIntent, next: ViewportMountIntent): boolean {
  // Replaces both needsRerendering checks of the old comparator: any explicit
  // invalidation (eg segmentation hydration) bumps the composition revision.
  if (prev.compositionRevision !== next.compositionRevision) {
    return false;
  }

  if (prev.displaySets.length !== next.displaySets.length) {
    return false;
  }

  if (prev.viewportOptions.orientation !== next.viewportOptions.orientation) {
    return false;
  }

  if (prev.viewportOptions.toolGroupId !== next.viewportOptions.toolGroupId) {
    return false;
  }

  if (
    next.viewportOptions.viewportType &&
    prev.viewportOptions.viewportType !== next.viewportOptions.viewportType
  ) {
    return false;
  }

  if (prev.dataSource !== next.dataSource) {
    return false;
  }

  if (prev.initialImageIndex !== next.initialImageIndex) {
    return false;
  }

  const prevDisplaySets = prev.displaySets;
  const nextDisplaySets = next.displaySets;

  for (let i = 0; i < prevDisplaySets.length; i++) {
    const prevDisplaySet = prevDisplaySets[i];

    const foundDisplaySet = nextDisplaySets.find(
      nextDisplaySet =>
        nextDisplaySet.displaySetInstanceUID === prevDisplaySet.displaySetInstanceUID
    );

    if (!foundDisplaySet) {
      return false;
    }

    // check they contain the same image
    if (foundDisplaySet.images?.length !== prevDisplaySet.images?.length) {
      return false;
    }

    // check if their imageIds are the same
    if (foundDisplaySet.images?.length) {
      for (let j = 0; j < foundDisplaySet.images.length; j++) {
        if (foundDisplaySet.images[j].imageId !== prevDisplaySet.images[j].imageId) {
          return false;
        }
      }
    }
  }

  return true;
}

interface MountEntry {
  element: HTMLDivElement | null;
  intent: ViewportMountIntent | null;
  /** The intent the last started mount pipeline ran with; null forces a remount. */
  lastMountedIntent: ViewportMountIntent | null;
  /** Monotonic supersession token; bumping it aborts any in-flight mount. */
  inflightToken: number;
}

export function createViewportMountController({
  servicesManager,
  setViewportData,
  updateViewport,
  getViewportInfo,
}: ViewportMountControllerArgs): ViewportMountController {
  const entries = new Map<string, MountEntry>();
  let destroyed = false;

  const getEntry = (viewportId: string): MountEntry => {
    let entry = entries.get(viewportId);
    if (!entry) {
      entry = { element: null, intent: null, lastMountedIntent: null, inflightToken: 0 };
      entries.set(viewportId, entry);
    }
    return entry;
  };

  const runMount = async (viewportId: string, entry: MountEntry): Promise<void> => {
    const intent = entry.intent;
    // Recorded BEFORE the async pipeline so an equal republish during the
    // await (eg StrictMode double effects) no-ops instead of double-mounting;
    // an unequal intent supersedes via the token below and runs its own mount.
    entry.lastMountedIntent = intent;
    const token = ++entry.inflightToken;

    try {
      const { cornerstoneCacheService } = servicesManager.services;

      // The old component mutated the viewportOptions prop object (grid
      // composition state) for both the stack default and the dynamic-volume
      // override; apply them on a copy so composition state is never written
      // from the mount path.
      const effectiveViewportOptions = { ...intent.viewportOptions };
      if (intent.displaySets.some(ds => ds.isDynamicVolume && ds.isReconstructable)) {
        // Dynamic data is only supported in volume viewports.
        effectiveViewportOptions.viewportType = 'volume';
      } else if (!effectiveViewportOptions.viewportType) {
        effectiveViewportOptions.viewportType = STACK;
      }

      const viewportData = await cornerstoneCacheService.createViewportData(
        intent.displaySets,
        effectiveViewportOptions,
        intent.dataSource,
        intent.initialImageIndex
      );

      // Superseded mid-flight (newer intent, detach, or destroy): abort
      // silently. setViewportData's own composition-revision guard remains the
      // second line of defense.
      if (destroyed || entry.inflightToken !== token || !entry.element) {
        return;
      }

      const presentations = getViewportPresentations(viewportId, effectiveViewportOptions);

      setViewportData(
        viewportId,
        viewportData,
        effectiveViewportOptions,
        intent.displaySetOptions,
        presentations
      );
    } catch (error) {
      // A failed pipeline must not poison retries: lastMountedIntent was
      // recorded up front, so without clearing it an EQUAL republish would
      // no-op forever. Only the still-current mount clears it (a superseding
      // mount already owns the entry) and reports the error phase for the
      // revision this mount was for.
      if (!destroyed && entry.inflightToken === token) {
        entry.lastMountedIntent = null;
        servicesManager.services.viewportGridService?.reportPhase?.(
          viewportId,
          'error',
          intent.compositionRevision
        );
      }
      console.warn(`Viewport mount failed for ${viewportId}`, error);
    }
  };

  const reconcile = (viewportId: string, entry: MountEntry): void => {
    if (destroyed || !entry.element || !entry.intent) {
      return;
    }
    if (entry.lastMountedIntent && compareMountIntent(entry.lastMountedIntent, entry.intent)) {
      return;
    }
    runMount(viewportId, entry);
  };

  // ONE subscription for the whole controller (moved verbatim from the
  // per-component effect): when a display set's series metadata is
  // invalidated, every attached viewport showing it rebuilds its viewport
  // data (network cache backed) and re-mounts keeping the camera.
  const { displaySetService } = servicesManager.services;
  const invalidationSubscription = displaySetService.subscribe(
    displaySetService.EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED,
    async ({
      displaySetInstanceUID: invalidatedDisplaySetInstanceUID,
      invalidateData,
    }: Types.DisplaySetSeriesMetadataInvalidatedEvent) => {
      if (!invalidateData) {
        return;
      }

      const { cornerstoneCacheService } = servicesManager.services;

      // Indexed loop over a snapshot, NOT for..of over the live Map: entries
      // can be pruned (detach) during the awaits below, and the babel
      // regenerator transform used by jest mis-compiles try/catch around an
      // await inside for..of (the iterator-finalization wrapper swallows the
      // catch), letting one viewport's failure abort the whole fan-out.
      const snapshot = Array.from(entries.entries());
      for (let i = 0; i < snapshot.length; i++) {
        const [viewportId, entry] = snapshot[i];
        if (!entry.element) {
          continue;
        }

        const viewportInfo = getViewportInfo(viewportId);

        if (!viewportInfo?.hasDisplaySet(invalidatedDisplaySetInstanceUID)) {
          continue;
        }

        // Each viewport is isolated: one failure must not abort the fan-out
        // to the remaining viewports showing the invalidated display set.
        try {
          const viewportData = viewportInfo.getViewportData();
          const newViewportData = await cornerstoneCacheService.invalidateViewportData(
            viewportData,
            invalidatedDisplaySetInstanceUID,
            entry.intent?.dataSource,
            displaySetService
          );

          // The viewport may have detached during the await; remounting a
          // disabled viewport throws on the next backend.
          if (destroyed || !entry.element) {
            continue;
          }

          const keepCamera = true;
          updateViewport(viewportId, newViewportData, keepCamera);
        } catch (error) {
          console.warn(`Viewport data invalidation failed for ${viewportId}`, error);
        }
      }
    }
  );

  return {
    attachElement(viewportId, element) {
      const entry = getEntry(viewportId);
      entry.element = element;
      reconcile(viewportId, entry);
    },

    detachElement(viewportId) {
      const entry = entries.get(viewportId);
      if (!entry) {
        return;
      }
      // Cancel any in-flight mount (the pipeline holds this entry object, so
      // the token bump and element clear still abort it post-await) and prune
      // the whole entry. Retaining the intent would (a) pin displaySets/
      // dataSource for retired viewportIds forever and (b) let a re-attach of
      // a NEW component instance start a doomed mount with the PREVIOUS
      // instance's stale intent. Pruning is safe because every React attach
      // is followed in the same commit by the no-deps intent-publish effect,
      // which re-supplies a fresh intent; attach with no intent is a no-op.
      entry.inflightToken++;
      entry.element = null;
      entry.intent = null;
      entry.lastMountedIntent = null;
      entries.delete(viewportId);
    },

    setMountIntent(viewportId, intent) {
      const entry = getEntry(viewportId);
      entry.intent = intent;
      reconcile(viewportId, entry);
    },

    destroy() {
      destroyed = true;
      invalidationSubscription?.unsubscribe?.();
      entries.forEach(entry => {
        entry.inflightToken++;
        entry.element = null;
        entry.lastMountedIntent = null;
        entry.intent = null;
      });
      entries.clear();
    },
  };
}
