import { DicomMetadataStore, utils } from '@ohif/core';
import { preserveQueryParameters } from '@ohif/app';

const { formatPN } = utils;

/** Fields read from `query.studies.search` responses; remainder spread into `study`. */
type StudySearchRow = { modalities?: string } & Record<string, unknown>;

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

/**
 * Normalizes a modalities string for comparison (e.g. path-like separators are unified).
 */
export function normalizeModalitiesString(raw?: string): string {
  return (raw || '').replaceAll('/', '\\');
}

/**
 * True when the normalized modalities string contains at least one non-empty modality token.
 */
export function hasUsableModalities(modalities?: string): boolean {
  const normalized = normalizeModalitiesString(modalities);
  if (!normalized) {
    return false;
  }

  return normalized.split('\\').some(token => token.trim() !== '');
}

/**
 * Builds a sorted, normalized modalities string from a list of modality codes.
 */
export function modalitiesStringFromSet(modalitySet: Set<string>): string {
  if (modalitySet.size === 0) {
    return '';
  }

  return normalizeModalitiesString([...modalitySet].sort().join('/'));
}

/**
 * Collects modalities from series already loaded in `DicomMetadataStore`.
 */
export function modalitiesFromMetadataStore(studyInstanceUID: string): string {
  const meta = DicomMetadataStore.getStudy(studyInstanceUID);
  if (!meta?.series?.length) {
    return '';
  }

  const modalitySet = new Set<string>();

  meta.series.forEach(series => {
    if (series?.instances?.length) {
      const rawModality = series.instances[0].Modality;
      if (rawModality != null && `${rawModality}`.trim() !== '') {
        modalitySet.add(String(rawModality));
      }
    }
  });

  return modalitiesStringFromSet(modalitySet);
}

/**
 * Collects modalities from a QIDO series search when study-level tags are missing.
 */
export async function modalitiesFromSeriesSearch(
  studyInstanceUID: string,
  dataSource: DataSourceWithStudySearch | null | undefined
): Promise<string> {
  const seriesSearch = dataSource?.query?.series?.search;
  if (!seriesSearch) {
    return '';
  }

  try {
    const series = await seriesSearch(studyInstanceUID);
    const modalitySet = new Set<string>();

    series?.forEach(row => {
      const modality = row?.modality;
      if (modality != null && `${modality}`.trim() !== '') {
        modalitySet.add(String(modality));
      }
    });

    return modalitiesStringFromSet(modalitySet);
  } catch (_e) {
    return '';
  }
}

/**
 * Resolves modalities for mode validity: QIDO study field, then loaded metadata, then series QIDO.
 */
export async function resolveStudyModalities(
  studyInstanceUID: string,
  dataSource: DataSourceWithStudySearch | null | undefined,
  qidoModalities?: string
): Promise<string> {
  if (hasUsableModalities(qidoModalities)) {
    return normalizeModalitiesString(qidoModalities);
  }

  const fromMetadataStore = modalitiesFromMetadataStore(studyInstanceUID);
  if (hasUsableModalities(fromMetadataStore)) {
    return fromMetadataStore;
  }

  const fromSeriesSearch = await modalitiesFromSeriesSearch(studyInstanceUID, dataSource);
  if (hasUsableModalities(fromSeriesSearch)) {
    return fromSeriesSearch;
  }

  return '';
}

function buildStudyEnvelopeFromMetadataStore(studyInstanceUID: string): StudyEnvelope | null {
  const meta = DicomMetadataStore.getStudy(studyInstanceUID);
  if (!meta?.series?.length) {
    return null;
  }

  const modalitySet = new Set<string>();
  let numInstances = 0;

  meta.series.forEach(series => {
    if (series?.instances?.length) {
      const rawModality = series.instances[0].Modality;
      if (rawModality != null && `${rawModality}`.trim() !== '') {
        modalitySet.add(String(rawModality));
      }
      numInstances += series.instances.length;
    }
  });

  const modalitiesNormalized = modalitiesStringFromSet(modalitySet);
  const firstSeriesWithInstance = meta.series.find(s => s?.instances?.length);
  const inst0 = firstSeriesWithInstance?.instances?.[0];
  const studyPayload = {
    studyInstanceUid: studyInstanceUID,
    modalities: modalitiesNormalized,
    mrn: inst0?.PatientID,
    instances: numInstances,
    description: inst0?.StudyDescription,
    date: inst0?.StudyDate,
    time: inst0?.StudyTime,
    accession: inst0?.AccessionNumber,
    patientName: inst0?.PatientName ? formatPN(inst0.PatientName) : '',
    studyInstanceUID: studyInstanceUID,
    StudyInstanceUID: studyInstanceUID,
  };

  return {
    modalitiesToCheck: modalitiesNormalized,
    study: studyPayload,
  };
}

/**
 * Loads study metadata for the mode selector: tries the active data source search, then falls back
 * to `DicomMetadataStore` and series QIDO when study-level modalities are missing.
 */
export async function fetchStudyEnvelope(
  StudyInstanceUID: string,
  dataSource: DataSourceWithStudySearch | null | undefined,
  options?: { preferLoadedMetadata?: boolean }
): Promise<StudyEnvelope | null> {
  if (options?.preferLoadedMetadata) {
    const fromMetadataStore = buildStudyEnvelopeFromMetadataStore(StudyInstanceUID);
    if (fromMetadataStore) {
      return fromMetadataStore;
    }
  }

  try {
    // Call as a method on query.studies so `this` inside search is bound (do not extract the function).
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
    // Fallback to locally loaded metadata or series QIDO
  }

  const fromMetadataStore = buildStudyEnvelopeFromMetadataStore(StudyInstanceUID);
  if (fromMetadataStore?.modalitiesToCheck) {
    return fromMetadataStore;
  }

  const modalitiesToCheck = await resolveStudyModalities(StudyInstanceUID, dataSource);
  if (!modalitiesToCheck) {
    return fromMetadataStore;
  }

  if (fromMetadataStore) {
    return {
      modalitiesToCheck,
      study: { ...fromMetadataStore.study, modalities: modalitiesToCheck },
    };
  }

  return {
    modalitiesToCheck,
    study: {
      studyInstanceUid: StudyInstanceUID,
      studyInstanceUID: StudyInstanceUID,
      StudyInstanceUID,
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
 */
export function evaluateModeValidity(
  mode: ModeWithValidityChecker,
  studyEnvelope: StudyEnvelope,
  unevaluableMessage: string
): ModeValidityResult {
  if (typeof mode.isValidMode !== 'function') {
    return { valid: true };
  }
  try {
    return mode.isValidMode.call(mode, {
      modalities: studyEnvelope.modalitiesToCheck,
      study: studyEnvelope.study,
    });
  } catch (_e) {
    return { valid: false, description: unevaluableMessage };
  }
}

export type BuildModeSwitchSearchOptions = {
  /** Query param keys to remove when switching modes. */
  stripQueryParams?: ReadonlyArray<string>;
  /** Sets the `datasources` query param (standard OHIF mode routes omit the data source path segment). */
  dataSourceName?: string;
};

/**
 * Builds the query string for mode-switch links.
 * Ensures StudyInstanceUIDs are present when provided explicitly for navigation.
 */
export function buildModeSwitchSearch(
  locationSearch: string,
  studyInstanceUIDs?: string | ReadonlyArray<string>,
  options: BuildModeSwitchSearchOptions = {}
): string {
  const next = new URLSearchParams(locationSearch);
  const current = new URLSearchParams(locationSearch);

  preserveQueryParameters(next);

  current.getAll('datasources').forEach(value => {
    if (value && !next.getAll('datasources').includes(value)) {
      next.append('datasources', value);
    }
  });

  options.stripQueryParams?.forEach(key => {
    next.delete(key);
  });

  if (options.dataSourceName) {
    next.delete('datasources');
    next.set('datasources', options.dataSourceName);
  }

  const uidsFromArg = (
    studyInstanceUIDs ?
      Array.isArray(studyInstanceUIDs) ?
        studyInstanceUIDs
      : [studyInstanceUIDs]
    : []
  ).filter(Boolean);

  const existingUids = [...current.getAll('StudyInstanceUIDs'), ...current.getAll('studyInstanceUIDs')];

  const uidsToSet = uidsFromArg.length > 0 ? uidsFromArg : existingUids;

  if (uidsToSet.length > 0) {
    next.delete('StudyInstanceUIDs');
    next.delete('studyInstanceUIDs');
    uidsToSet.forEach(uid => next.append('StudyInstanceUIDs', uid));
  }

  const s = next.toString();
  return s ? `?${s}` : '';
}

export type BuildModeSwitchHrefOptions = BuildModeSwitchSearchOptions;

/**
 * Full path + query for mode-switch navigation (string form for React Router `Link`).
 * Uses the single-segment mode route (e.g. `/segmentation`) plus `datasources` in the query string.
 */
export function buildModeSwitchHref(
  routeName: string,
  locationSearch: string,
  studyInstanceUIDs?: string | ReadonlyArray<string>,
  options: BuildModeSwitchHrefOptions = {}
): string {
  const search = buildModeSwitchSearch(locationSearch, studyInstanceUIDs, options);

  return `/${routeName}${search}`;
}

/** Compares the current viewer location to a mode-switch href string. */
export function isCurrentModeHref(
  pathname: string,
  search: string,
  modeHref: string
): boolean {
  const current = `${pathname}${search || ''}`;
  return current === modeHref || pathname === modeHref.split('?')[0];
}
