/**
 * usePatientDemographics.ts (MIMPS-35)
 *
 * A `usePatientInfo`-style hook (modeled on extensions/default's usePatientInfo)
 * that surfaces the active study's DICOM demographics inside the blackvoxel-ai
 * extension. Unlike the core hook it takes the OHIF `servicesManager` as a prop
 * (loosely typed at the extension boundary, like useLengthMeasurements) instead
 * of `useSystem()`, so it works from the AI panels without reaching into core.
 *
 * It reads PatientID / PatientSex / PatientBirthDate off the first instance of
 * the first active display set and re-reads on DISPLAY_SETS_ADDED. These are
 * local DICOM header fields (research import or PACS) — the de-identified FHIR
 * clinical context is fetched separately via labsClient and never mixed in here.
 */

import { useEffect, useState } from 'react';

export interface PatientDemographics {
  PatientID: string | null;
  PatientSex: string | null;
  PatientBirthDate: string | null;
}

const EMPTY: PatientDemographics = {
  PatientID: null,
  PatientSex: null,
  PatientBirthDate: null,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Pull demographics off the first instance of a display set, if present. */
function readFromDisplaySet(displaySet: unknown): PatientDemographics | null {
  if (!isObject(displaySet)) {
    return null;
  }
  const instances = displaySet.instances;
  const instance =
    Array.isArray(instances) && instances.length > 0 ? instances[0] : displaySet.instance;
  if (!isObject(instance)) {
    return null;
  }
  return {
    PatientID: asStringOrNull(instance.PatientID),
    PatientSex: asStringOrNull(instance.PatientSex),
    PatientBirthDate: asStringOrNull(instance.PatientBirthDate),
  };
}

/**
 * Returns the active patient's DICOM demographics, kept in sync with the
 * display-set service. Resolves to all-null when no display set / service is
 * available (e.g. clinical mode is off and the panel is inert).
 */
export function usePatientDemographics(servicesManager?: unknown): PatientDemographics {
  const [demographics, setDemographics] = useState<PatientDemographics>(EMPTY);

  useEffect(() => {
    if (!isObject(servicesManager)) {
      setDemographics(EMPTY);
      return;
    }
    const services = servicesManager.services;
    if (!isObject(services)) {
      setDemographics(EMPTY);
      return;
    }
    const displaySetService = services.displaySetService;
    if (!isObject(displaySetService)) {
      setDemographics(EMPTY);
      return;
    }

    const getActiveDisplaySets = displaySetService.getActiveDisplaySets;
    const subscribe = displaySetService.subscribe;
    const EVENTS = displaySetService.EVENTS;

    const recompute = (): void => {
      if (typeof getActiveDisplaySets !== 'function') {
        setDemographics(EMPTY);
        return;
      }
      const raw = getActiveDisplaySets.call(displaySetService) as unknown;
      const list = Array.isArray(raw) ? raw : [];
      for (const ds of list) {
        const found = readFromDisplaySet(ds);
        if (found && (found.PatientID || found.PatientSex || found.PatientBirthDate)) {
          setDemographics(found);
          return;
        }
      }
      setDemographics(EMPTY);
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

  return demographics;
}
