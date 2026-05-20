import { COLUMN_IDS } from '@ohif/ui-next';

/**
 * Canonical URL query keys for study-list filters, sorting, and pagination.
 *
 * This is the single source of truth for the URL contract documented in
 * `platform/docs/docs/configuration/url.md`. WorkList's URL serializer and
 * URL parser use these constants, as does
 * `DataSourceWrapper._getQueryFilterValues`, so the writer and reader stay
 * in lockstep.
 *
 * Values use the documented camelCase form (`patientName` rather than
 * `patientname`), so URLs produced by the serializer render as
 * `?patientName=…` and match what's documented. URL parsing is
 * case-insensitive in this codebase (the readers lowercase before lookup),
 * so bookmarks using any casing still work. To read a URL parameter by its
 * canonical key, use `getUrlParam` below.
 */
export const URL_KEYS = {
  // Filter values
  patientName: 'patientName',
  mrn: 'mrn',
  description: 'description',
  accession: 'accession',
  modalities: 'modalities',
  startDate: 'startDate',
  endDate: 'endDate',

  // Sorting + pagination
  sortBy: 'sortBy',
  sortDirection: 'sortDirection',
  pageNumber: 'pageNumber',
  resultsPerPage: 'resultsPerPage',

  // Misc
  dataSources: 'dataSources',
} as const;

/**
 * Read a URL parameter by its canonical key, case-insensitively. Pass a
 * value from `URL_KEYS`.
 */
export function getUrlParam(params: URLSearchParams, key: string): string | null {
  return params.get(key.toLowerCase());
}

/**
 * Column ID → canonical URL key for text-filter columns. Listed explicitly
 * so adding a new text-filter column requires registering its URL key here
 * — that's the whole point of centralizing the contract.
 */
const TEXT_FILTER_URL_KEYS: Record<string, string> = {
  [COLUMN_IDS.PATIENT]: URL_KEYS.patientName,
  [COLUMN_IDS.MRN]: URL_KEYS.mrn,
  [COLUMN_IDS.DESCRIPTION]: URL_KEYS.description,
  [COLUMN_IDS.ACCESSION]: URL_KEYS.accession,
};

export function urlKeyForTextFilter(columnId: string): string {
  return TEXT_FILTER_URL_KEYS[columnId] ?? columnId.toLowerCase();
}
