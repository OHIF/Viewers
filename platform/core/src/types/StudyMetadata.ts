/** Defines a typescript type for study metadata */

export interface PatientMetadata extends Record<string, unknown> {
  PatientName?: string;
  PatientId?: string;
}

export interface StudyMetadata extends Record<string, unknown> {
  readonly StudyInstanceUID?: string;
  StudyDescription?: string;
}

export interface SeriesMetadata extends StudyMetadata {
  readonly SeriesInstanceUID?: string;
  SeriesDescription?: string;
  SeriesNumber?: string | number;
}

export interface InstanceMetadata extends SeriesMetadata {
  readonly SOPInstanceUID: string;
  InstanceNumber?: string | number;
}
export default StudyMetadata;
