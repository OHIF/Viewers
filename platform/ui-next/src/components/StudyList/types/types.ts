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
