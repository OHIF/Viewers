export type StudyRow = {
  studyInstanceUid: string;
  patientName: string;
  mrn: string;
  /** Raw date string (YYYYMMDD or YYYY.MM.DD format) */
  date: string;
  /** Raw time string (HH, HHmm, HHmmss, or HHmmss.SSS format) */
  time: string;
  modalities: string;
  description: string;
  accession: string;
  instances: number;
  // A data source may map additional fields (e.g. extra DICOM attributes pulled
  // in via `includefield`). Allowing arbitrary keys means a custom column can
  // read one without StudyRow needing an edit per field. The declared fields
  // above keep their precise types.
  [key: string]: unknown;
};

export type StudyDateRangeFilter = {
  startDate?: string;
  endDate?: string;
};

export const PreviewThumbnailStatusState = {
  Loading: 'loading',
  Ready: 'ready',
  NotAvailable: 'notAvailable',
  NotApplicable: 'notApplicable',
} as const;

export type PreviewThumbnailStatusState =
  (typeof PreviewThumbnailStatusState)[keyof typeof PreviewThumbnailStatusState];

type NonReadyPreviewThumbnailStatusState = Exclude<
  PreviewThumbnailStatusState,
  typeof PreviewThumbnailStatusState.Ready
>;

export type PreviewThumbnailStatus =
  | { status: NonReadyPreviewThumbnailStatusState }
  | { status: typeof PreviewThumbnailStatusState.Ready; src: string };
