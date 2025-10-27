export type StudyRow = {
  patient: string
  mrn: string
  studyDateTime: string
  modalities: string
  description: string
  accession: string
  instances: number
  /** Optional, data-driven list of available workflows for this study */
  workflows?: string[]
}
