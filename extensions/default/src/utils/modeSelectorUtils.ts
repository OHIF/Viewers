import { useMemo } from 'react';

import { type ExtensionManager, DicomMetadataStore, utils } from '@ohif/core';
import { preserveQueryParameters } from '@ohif/app';

const { formatPN } = utils;

/** Fields read from `query.studies.search` responses; remainder spread into `study`. */
type StudySearchRow = { modalities?: string } & Record<string, unknown>;

/** Fields read from `query.series.search` responses. */
type SeriesSearchRow = { modality?: string };

/** Data source subset used when calling study/series search to populate the envelope. */
export type DataSourceWithStudySearch = {
  query?: {
    studies?: {
      search?: (params: { studyInstanceUid: string }) => Promise<StudySearchRow[]> | StudySearchRow[];
    };
    series?: {
      search?: (studyInstanceUid: string) => Promise<SeriesSearchRow[]> | SeriesSearchRow[];
    };
  };
};

/** Normalized modalities string plus study fields for toolbar mode validity. */
export type StudyEnvelope = {
  modalitiesToCheck: string;
  study: Record<string, unknown>;
};

/** Argument for mode `isValidMode`. */
export type ModeValidityPayload = {
  modalities: string;
  study: Record<string, unknown>;
};

/** Result shape from mode `isValidMode`. */
export type ModeValidityResult = {
  valid: boolean;
  description?: string;
};

/** OHIF mode object carrying an optional `isValidMode` callback. */
export type ModeWithValidityChecker = {
  isValidMode?: (this: unknown, payload: ModeValidityPayload) => ModeValidityResult;
};

/** App-config `loadedModes` entry (`routeName` only). */
export type LoadedModeRouteHint = {
  routeName?: string | null | undefined;
};

type ExtensionManagerDataSources = Pick<ExtensionManager, 'getDataSources'>;

/**
 * Normalizes a modalities string for comparison (e.g. path-like separators are unified).
 */
export function normalizeModalitiesString(raw?: string): string {
  return (raw || '').replaceAll('/', '\\');
}

/**
 * True when the modalities string contains at least one non-empty modality token.
 */
export function hasUsableModalities(modalities?: string): boolean {
  return normalizeModalitiesString(modalities)
    .split('\\')
    .some(token => token.trim() !== '');
}

/**
 * Builds a sorted, normalized modalities string from a set of modality codes.
 */
export function modalitiesStringFromSet(modalitySet: Set<string>): string {
  return normalizeModalitiesString([...modalitySet].sort().join('/'));
}

/**
 * Adds a modality value to the set when it is a non-empty string.
 */
function addModality(modalitySet: Set<string>, rawModality: unknown): void {
  if (rawModality != null && `${rawModality}`.trim() !== '') {
    modalitySet.add(`${rawModality}`.trim());
  }
}

/**
 * Collects modalities from series already loaded in `DicomMetadataStore`.
 */
export function modalitiesFromMetadataStore(studyInstanceUID: string): Set<string> {
  const modalitySet = new Set<string>();
  const meta = DicomMetadataStore.getStudy(studyInstanceUID);
  meta?.series?.forEach(series => {
    if (series?.instances?.length) {
      addModality(modalitySet, series.instances[0].Modality);
    }
  });
  return modalitySet;
}

/**
 * Collects modalities from a series-level search of the study.
 */
export async function modalitiesFromSeriesSearch(
  studyInstanceUID: string,
  dataSource: DataSourceWithStudySearch | null | undefined
): Promise<Set<string>> {
  const modalitySet = new Set<string>();
  if (!dataSource?.query?.series?.search) {
    return modalitySet;
  }
  try {
    /** Call as a method on query.series so `this` inside search is bound. */
    const rows = await dataSource.query.series.search(studyInstanceUID);
    rows?.forEach(row => addModality(modalitySet, row?.modality));
  } catch (_e) {
    /** Leave the set empty; callers fall back to loaded metadata. */
  }
  return modalitySet;
}

/**
 * Resolves the modalities used for mode validity. Uses the study-level value (ModalitiesInStudy)
 * when the server returned one. Some servers (e.g. Google Healthcare) do not return it, so the
 * fallback is the union of series already in `DicomMetadataStore` and a series search. Loaded
 * metadata alone is not enough: with lazy study loading only some series may be loaded when the
 * selector evaluates modes.
 */
export async function resolveStudyModalities(
  studyInstanceUID: string,
  dataSource: DataSourceWithStudySearch | null | undefined,
  studyModalities?: string
): Promise<string> {
  if (hasUsableModalities(studyModalities)) {
    return normalizeModalitiesString(studyModalities);
  }

  const modalitySet = modalitiesFromMetadataStore(studyInstanceUID);
  const fromSeriesSearch = await modalitiesFromSeriesSearch(studyInstanceUID, dataSource);
  fromSeriesSearch.forEach(modality => modalitySet.add(modality));

  return modalitiesStringFromSet(modalitySet);
}

/**
 * Builds a study payload from series already in `DicomMetadataStore`, or null if none are loaded.
 */
function studyFromMetadataStore(StudyInstanceUID: string): Record<string, unknown> | null {
  const meta = DicomMetadataStore.getStudy(StudyInstanceUID);
  if (!meta?.series?.length) {
    return null;
  }

  let numInstances = 0;
  meta.series.forEach(series => {
    numInstances += series?.instances?.length || 0;
  });

  const firstSeriesWithInstance = meta.series.find(s => s?.instances?.length);
  const inst0 = firstSeriesWithInstance?.instances?.[0];
  return {
    studyInstanceUid: StudyInstanceUID,
    mrn: inst0?.PatientID,
    instances: numInstances,
    description: inst0?.StudyDescription,
    date: inst0?.StudyDate,
    time: inst0?.StudyTime,
    accession: inst0?.AccessionNumber,
    patientName: inst0?.PatientName ? formatPN(inst0.PatientName) : '',
    studyInstanceUID: StudyInstanceUID,
    StudyInstanceUID,
  };
}

/**
 * Loads study metadata for the mode selector: tries the active data source study search, then falls
 * back to `DicomMetadataStore`. When the study-level modalities are missing, they are resolved from
 * loaded series plus a series search (see `resolveStudyModalities`).
 */
export async function fetchStudyEnvelope(
  StudyInstanceUID: string,
  dataSource: DataSourceWithStudySearch | null | undefined
): Promise<StudyEnvelope | null> {
  try {
    /** Call as a method on query.studies so `this` inside search is bound (do not extract the function). */
    if (dataSource?.query?.studies?.search) {
      const rows = await dataSource.query.studies.search({ studyInstanceUid: StudyInstanceUID });
      const row = rows?.[0];
      if (row) {
        const modalitiesToCheck = await resolveStudyModalities(
          StudyInstanceUID,
          dataSource,
          row.modalities
        );
        return {
          modalitiesToCheck,
          study: { ...row, modalities: modalitiesToCheck },
        };
      }
    }
  } catch (_e) {
    /** Fall back to locally loaded metadata and series search */
  }

  const study = studyFromMetadataStore(StudyInstanceUID);
  const modalitiesToCheck = await resolveStudyModalities(StudyInstanceUID, dataSource);
  if (!study && !modalitiesToCheck) {
    return null;
  }

  return {
    modalitiesToCheck,
    study: {
      ...(study || {
        studyInstanceUid: StudyInstanceUID,
        studyInstanceUID: StudyInstanceUID,
        StudyInstanceUID,
      }),
      modalities: modalitiesToCheck,
    },
  };
}

/**
 * Whether a mode should be included when ordering/sorting mode options, using `isValidMode` when present.
 * Returns true if the mode has no checker or if the checker reports valid.
 */
export function modeIsValidForOrdering(mode: ModeWithValidityChecker, studyEnvelope: StudyEnvelope): boolean {
  if (typeof mode.isValidMode !== 'function') {
    return true;
  }
  try {
    return !!mode.isValidMode.call(mode, {
      modalities: studyEnvelope.modalitiesToCheck,
      study: studyEnvelope.study,
    })?.valid;
  } catch (_e) {
    return false;
  }
}

/**
 * Runs a mode's `isValidMode` for UI messaging; on success returns its result, on throw returns invalid with a fallback message.
 * Returns null if the mode validator returns a falsy value (null/undefined).
 */
export function evaluateModeValidity(
  mode: ModeWithValidityChecker,
  studyEnvelope: StudyEnvelope,
  unevaluableMessage: string
): ModeValidityResult | null {
  if (typeof mode.isValidMode !== 'function') {
    return { valid: true };
  }
  try {
    const result = mode.isValidMode.call(mode, {
      modalities: studyEnvelope.modalitiesToCheck,
      study: studyEnvelope.study,
    });
    /** Guard against validators that return null/undefined */
    if (!result) {
      return null;
    }
    return result;
  } catch (_e) {
    return { valid: false, description: unevaluableMessage };
  }
}

/**
 * From the current URL path, returns the segment that names the data source (the piece after the mode route), if any.
 */
export function getDataSourcePathSegment(
  locationPathname: string,
  loadedModes: ReadonlyArray<LoadedModeRouteHint | null | undefined> | undefined,
  extensionManager: ExtensionManagerDataSources | null | undefined
): string | undefined {
  const routeNames = new Set((loadedModes || []).filter(Boolean).map(m => m?.routeName).filter(Boolean));
  const segs = locationPathname.split('/').filter(Boolean);

  const modeSegmentIndex = segs.findIndex(seg => routeNames.has(seg));
  if (modeSegmentIndex === -1 || modeSegmentIndex + 1 >= segs.length) {
    return undefined;
  }

  const candidate = segs[modeSegmentIndex + 1];
  if (
    candidate &&
    !routeNames.has(candidate) &&
    extensionManager?.getDataSources?.(candidate)?.length
  ) {
    return candidate;
  }
  return undefined;
}

/**
 * React hook: builds the search string to append to mode-switch links while keeping viewer-wide query params.
 */
export function usePreservedViewerSearch(
  locationSearch: string,
  customizationService?: Parameters<typeof preserveQueryParameters>[1]
): string {
  return useMemo(() => {
    const next = new URLSearchParams(locationSearch);
    /**
     * Collect the preserved params on their own, then replace them in `next`. `next` comes from the
     * same search string that preserveQueryParameters reads, so appending directly would duplicate them.
     */
    const preserved = new URLSearchParams();
    preserveQueryParameters(preserved, customizationService, new URLSearchParams(locationSearch));
    for (const key of new Set(preserved.keys())) {
      next.delete(key);
    }
    preserved.forEach((value, key) => next.append(key, value));
    const s = next.toString();
    return s ? `?${s}` : '';
  }, [locationSearch, customizationService]);
}
