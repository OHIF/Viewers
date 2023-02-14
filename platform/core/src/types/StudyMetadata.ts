/** Defines a typescript interface for study metadata.
 * This defines the types for when using study metadata as interfaces.
 */

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
