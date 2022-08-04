/** Defines a typescript type for study metadata */
interface StudyMetadata {
  readonly StudyInstanceUID: string;
  StudyDescription?: string;
}

export default StudyMetadata;
