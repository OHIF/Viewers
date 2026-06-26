/**
 * useActiveModality.ts (MIMPS-41)
 *
 * A `usePatientDemographics`-style hook (same servicesManager-prop pattern, so
 * it works from the AI panels without reaching into OHIF core) that surfaces
 * the active study's DICOM modality. Reads `Modality` off the active display
 * sets and re-reads on DISPLAY_SETS_ADDED.
 *
 * Used to gate the BlackVoxel AI features by modality: only chest-radiograph
 * modalities (CR / DR / DX) are AI-eligible. MR / CT / anything else is
 * transport-only (no proxy-txv-v1 model), so the AI panel is hidden/disabled
 * and NO inference or persisted-result fetch fires for them (MIMPS-41/42).
 */

import { useEffect, useState } from 'react';

/** Chest-radiograph modalities the proxy-txv-v1 lane is trained for. */
export const CXR_MODALITIES: ReadonlySet<string> = new Set(['CR', 'DR', 'DX']);

/** True when `modality` is a chest-radiograph modality (AI-eligible). */
export function isCxrModality(modality: string | null | undefined): boolean {
  return typeof modality === 'string' && CXR_MODALITIES.has(modality.trim().toUpperCase());
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asUpperOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value.trim().toUpperCase() : null;
}

/** Pull the modality off a display set (its own field, or its first instance). */
function readModalityFromDisplaySet(displaySet: unknown): string | null {
  if (!isObject(displaySet)) {
    return null;
  }
  // OHIF display sets carry `Modality` directly; fall back to the first instance.
  const direct = asUpperOrNull(displaySet.Modality);
  if (direct) {
    return direct;
  }
  const instances = displaySet.instances;
  const instance =
    Array.isArray(instances) && instances.length > 0 ? instances[0] : displaySet.instance;
  if (!isObject(instance)) {
    return null;
  }
  return asUpperOrNull(instance.Modality);
}

/**
 * Returns the active study's DICOM modality (upper-cased, e.g. "CR" / "MR"),
 * kept in sync with the display-set service. Resolves to null when no display
 * set / service is available.
 *
 * Resolution rule: the FIRST non-null modality across the active display sets.
 * In a single-study viewer session every display set shares the study's
 * modality, so the first hit is the study modality. (A mixed-modality study is
 * vanishingly rare for the CR/DR/DX vs MR/CT split this gate cares about.)
 */
export function useActiveModality(servicesManager?: unknown): string | null {
  const [modality, setModality] = useState<string | null>(null);

  useEffect(() => {
    if (!isObject(servicesManager)) {
      setModality(null);
      return;
    }
    const services = servicesManager.services;
    if (!isObject(services)) {
      setModality(null);
      return;
    }
    const displaySetService = services.displaySetService;
    if (!isObject(displaySetService)) {
      setModality(null);
      return;
    }

    const getActiveDisplaySets = displaySetService.getActiveDisplaySets;
    const subscribe = displaySetService.subscribe;
    const EVENTS = displaySetService.EVENTS;

    const recompute = (): void => {
      if (typeof getActiveDisplaySets !== 'function') {
        setModality(null);
        return;
      }
      const raw = getActiveDisplaySets.call(displaySetService) as unknown;
      const list = Array.isArray(raw) ? raw : [];
      for (const ds of list) {
        const found = readModalityFromDisplaySet(ds);
        if (found) {
          setModality(found);
          return;
        }
      }
      setModality(null);
    };

    recompute();

    if (typeof subscribe !== 'function' || !isObject(EVENTS)) {
      return;
    }
    const evt = EVENTS.DISPLAY_SETS_ADDED;
    if (typeof evt !== 'string') {
      return;
    }
    const sub = subscribe.call(displaySetService, evt, recompute);
    const unsubscribe =
      isObject(sub) && typeof sub.unsubscribe === 'function'
        ? (sub.unsubscribe as () => void)
        : () => {};
    return () => {
      unsubscribe();
    };
  }, [servicesManager]);

  return modality;
}
