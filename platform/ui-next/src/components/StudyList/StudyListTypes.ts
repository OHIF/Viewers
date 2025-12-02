export type StudyRow = {
  studyInstanceUid: string;
  patient: string;
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
