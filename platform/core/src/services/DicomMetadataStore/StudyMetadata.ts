/** Defines a typescript type for study metadata */
export interface StudyMetadata {
  readonly StudyInstanceUID: string;
  StudyDescription?: string;
}

export interface SeriesMetadata extends StudyMetadata {
  readonly SeriesInstanceUID: string;
  SeriesDescription?: string;
  SeriesNumber?: string | number;
}

export interface InstanceMetadata extends SeriesMetadata {
  readonly SOPInstanceUID: string;
}

export interface ImageMetadata extends InstanceMetadata {
  Rows?: number;
  Columns?: number;
}

export default StudyMetadata;
