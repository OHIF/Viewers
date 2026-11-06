import { useCallback, useEffect, useRef, useState } from 'react';
import { Enums, getEnabledElement } from '@cornerstonejs/core';
import type { Types } from '@cornerstonejs/core';
import { useSystem } from '@ohif/core';
import { useViewportDisplaySets } from './useViewportDisplaySets';

const { VIEWPORT_FIDELITY_CHANGED } = Enums.Events;

/** Brief recovered (green) hold, then withdrawn (VF-VIS-1c). Spec: ~1s. */
export const FIDELITY_RECOVERED_HOLD_MS = 1000;

/**
 * OHIF presentation of Cornerstone3D fidelity (VF-VIS / #6256).
 * - none: never lossy, no data, or recovered hold finished
 * - transient: lossy now, expected to improve (yellow)
 * - standing: lossy now, as good as it gets (red)
 * - recovered: was lossy, now not (green, brief)
 */
export type FidelityPresentation = 'none' | 'transient' | 'standing' | 'recovered';

export type ViewportFidelityView = {
  presentation: FidelityPresentation;
  /** True after any lossy state on the current display set (VF-VIS-1d). */
  wasLossy: boolean;
  state: Types.ViewportFidelityState | null;
  /** Re-show recovered while hovering after the hold withdrew. */
  revealRecovered: () => void;
  hideRecoveredReveal: () => void;
};

function presentationOf(
  state: Types.ViewportFidelityState | null | undefined,
  wasLossy: boolean
): FidelityPresentation {
  if (!state || state.shownState === 'hidden') {
    return 'none';
  }

  if (state.lossy) {
    return state.transient === false ? 'standing' : 'transient';
  }

  // Lossless (`done` or equivalent): only announce if this display set was lossy.
  return wasLossy ? 'recovered' : 'none';
}

function fidelityViewportOf(
  element: HTMLElement | null | undefined,
  cornerstoneViewportService: AppTypes.ServicesManager['services']['cornerstoneViewportService'],
  viewportId: string
): (Types.IViewport & { getFidelityState?: () => Types.ViewportFidelityState }) | null {
  if (element) {
    const enabled = getEnabledElement(element);
    const fromElement = enabled?.viewport as
      | (Types.IViewport & { getFidelityState?: () => Types.ViewportFidelityState })
      | undefined;
    if (fromElement && typeof fromElement.getFidelityState === 'function') {
      return fromElement;
    }
  }

  const fromService = cornerstoneViewportService?.getCornerstoneViewport(viewportId) as
    | (Types.IViewport & { getFidelityState?: () => Types.ViewportFidelityState })
    | null
    | undefined;

  if (fromService && typeof fromService.getFidelityState === 'function') {
    return fromService;
  }

  return null;
}

/**
 * Subscribes to `VIEWPORT_FIDELITY_CHANGED` for a viewport and derives the
 * OHIF presentation states (never-lossy history + brief recovered hold).
 */
export function useViewportFidelity({
  viewportId,
  element,
}: {
  viewportId: string;
  /** Viewport host element from the overlay (preferred for subscribe + read). */
  element?: HTMLElement | null;
}): ViewportFidelityView {
  const { servicesManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;
  const { backgroundDisplaySet } = useViewportDisplaySets(viewportId);

  const [state, setState] = useState<Types.ViewportFidelityState | null>(null);
  const [wasLossy, setWasLossy] = useState(false);
  const [presentation, setPresentation] = useState<FidelityPresentation>('none');
  const [forceRecovered, setForceRecovered] = useState(false);
  // Bumps when the CS viewport becomes available after a null first look.
  const [viewportEpoch, setViewportEpoch] = useState(0);

  const holdTimerRef = useRef<number>(0);
  const displaySetKeyRef = useRef<string | undefined>(undefined);
  const wasLossyRef = useRef(false);

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = 0;
    }
  }, []);

  const applyState = useCallback(
    (next: Types.ViewportFidelityState | null) => {
      const nextWasLossy = wasLossyRef.current || Boolean(next?.lossy);
      wasLossyRef.current = nextWasLossy;
      const nextPresentation = presentationOf(next, nextWasLossy);

      // Temporary debug — remove after fidelity indicator diagnosis.
      console.debug('[fidelity]', viewportId, {
        shownState: next?.shownState,
        lossy: next?.lossy,
        transient: next?.transient,
        cause: next?.cause,
        presentation: nextPresentation,
        wasLossy: nextWasLossy,
      });

      setState(next);
      setWasLossy(nextWasLossy);

      if (nextPresentation === 'recovered') {
        setForceRecovered(false);
        setPresentation('recovered');
        clearHold();
        holdTimerRef.current = window.setTimeout(() => {
          holdTimerRef.current = 0;
          setPresentation(prev => (prev === 'recovered' ? 'none' : prev));
        }, FIDELITY_RECOVERED_HOLD_MS);
        return;
      }

      clearHold();
      setPresentation(nextPresentation);
    },
    [clearHold, viewportId]
  );

  const readSnapshot = useCallback(() => {
    const viewport = fidelityViewportOf(element, cornerstoneViewportService, viewportId);
    if (!viewport) {
      console.debug('[fidelity]', viewportId, 'no viewport yet', {
        hasElement: Boolean(element),
      });
    }
    return viewport?.getFidelityState?.() ?? null;
  }, [cornerstoneViewportService, element, viewportId]);

  // Retry when the Cornerstone viewport is enabled after the overlay mounts.
  useEffect(() => {
    if (!viewportId || !cornerstoneViewportService) {
      return;
    }

    if (fidelityViewportOf(element, cornerstoneViewportService, viewportId)) {
      return;
    }

    const { unsubscribe } = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      ({ viewportId: eventViewportId }) => {
        if (eventViewportId !== viewportId) {
          return;
        }
        if (fidelityViewportOf(element, cornerstoneViewportService, viewportId)) {
          setViewportEpoch(n => n + 1);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewportId, cornerstoneViewportService, element]);

  // Reset lossiness history when the viewport shows a different display set (VF-VIS-7).
  useEffect(() => {
    const key = backgroundDisplaySet?.displaySetInstanceUID ?? '';
    if (displaySetKeyRef.current === undefined) {
      displaySetKeyRef.current = key;
      return;
    }
    if (displaySetKeyRef.current === key) {
      return;
    }
    displaySetKeyRef.current = key;
    clearHold();
    wasLossyRef.current = false;
    setWasLossy(false);
    setForceRecovered(false);
    applyState(readSnapshot());
  }, [backgroundDisplaySet?.displaySetInstanceUID, applyState, clearHold, readSnapshot]);

  useEffect(() => {
    const viewport = fidelityViewportOf(element, cornerstoneViewportService, viewportId);
    const listenEl = (element ?? viewport?.element) as HTMLElement | undefined;

    if (!listenEl || !viewport) {
      return;
    }

    const onFidelityChanged = (evt: Event) => {
      const detail = (evt as Types.EventTypes.ViewportFidelityChangedEvent).detail;
      if (detail?.viewportId && detail.viewportId !== viewportId) {
        return;
      }
      applyState(detail?.state ?? readSnapshot());
    };

    listenEl.addEventListener(VIEWPORT_FIDELITY_CHANGED, onFidelityChanged);
    applyState(readSnapshot());

    return () => {
      listenEl.removeEventListener(VIEWPORT_FIDELITY_CHANGED, onFidelityChanged);
      clearHold();
    };
  }, [
    viewportId,
    element,
    viewportEpoch,
    cornerstoneViewportService,
    applyState,
    readSnapshot,
    clearHold,
  ]);

  const revealRecovered = useCallback(() => {
    if (wasLossyRef.current && presentation === 'none' && state && !state.lossy) {
      setForceRecovered(true);
    }
  }, [presentation, state]);

  const hideRecoveredReveal = useCallback(() => {
    setForceRecovered(false);
  }, []);

  const shownPresentation: FidelityPresentation =
    forceRecovered && presentation === 'none' && wasLossy ? 'recovered' : presentation;

  return {
    presentation: shownPresentation,
    wasLossy,
    state,
    revealRecovered,
    hideRecoveredReveal,
  };
}
