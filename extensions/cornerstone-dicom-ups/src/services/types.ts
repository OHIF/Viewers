/**
 * DICOM UPS-RS constants, types and small DICOM JSON helpers (PS3.18, PS3.4
 * Annex CC, PS3.3). The SOP Class UIDs are from the DICOM PS3.6 registry.
 */

export const UPS_SOP_CLASS = '1.2.840.10008.5.1.4.34.6';
export const UPS_SOP_CLASS_PUSH = `${UPS_SOP_CLASS}.1`;
export const UPS_SOP_CLASS_WATCH = `${UPS_SOP_CLASS}.2`;
export const UPS_SOP_CLASS_PULL = `${UPS_SOP_CLASS}.3`;
export const UPS_SOP_CLASS_EVENT = `${UPS_SOP_CLASS}.4`;
export const UPS_SOP_CLASS_QUERY = `${UPS_SOP_CLASS}.5`;

/** The four UPS Procedure Step states (PS3.4 Table CC.1.1-1). */
export enum ProcedureStepState {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

/** DICOM attribute tags used by the Task Requester + Watcher. */
export const TAG = {
  AffectedSOPInstanceUID: '00001000',
  EventTypeID: '00001002',
  CodeValue: '00080100',
  CodingSchemeDesignator: '00080102',
  CodeMeaning: '00080104',
  ReferencedSOPClassUID: '00081150',
  ReferencedSOPInstanceUID: '00081155',
  ReferencedSOPSequence: '00081199',
  SOPClassUID: '00080016',
  SOPInstanceUID: '00080018',
  AccessionNumber: '00080050',
  PatientID: '00100020',
  PatientName: '00100010',
  SeriesInstanceUID: '0020000E',
  StudyInstanceUID: '0020000D',
  ScheduledProcedureStepStartDateTime: '00404005',
  ScheduledWorkitemCodeSequence: '00404018',
  InputInformationSequence: '00404021',
  OutputInformationSequence: '00404033',
  PerformedWorkitemStatus: '00404041',
  ReferencedRequestSequence: '0040A370',
  ProcedureStepState: '00741000',
  UPSPriority: '00741200',
  ScheduledWorkitemLabel: '00741204',
  UnifiedProcedureStepPerformedProcedureSequence: '00741216',
  ReasonForCancellation: '00741238',
} as const;

/** A DICOM JSON dataset (PS3.18 Annex F): tag key -> { vr, Value }. */
export interface DicomJsonDataset {
  [tag: string]: { vr: string; Value?: unknown[] } | undefined;
}

/** The code that names a task (Scheduled Workitem Code Sequence item). */
export interface WorkitemCode {
  codeValue: string;
  codingSchemeDesignator: string;
  codeMeaning?: string;
}

/** Connection settings of the UPS-RS Worklist server. */
export interface UpsConfig {
  /** DICOMweb base URL, e.g. http://host/dicomweb */
  baseUrl: string;
  /** AE Title identifying this user agent (the notification subscriber). */
  aeTitle?: string;
}

/** Read the first string value of an attribute, if any. */
export function getString(dataset: DicomJsonDataset, tag: string): string | undefined {
  const value = dataset[tag]?.Value;
  return Array.isArray(value) && value.length > 0 ? (value[0] as string) : undefined;
}

/** Read a sequence attribute's items, if any. */
export function getSequence(
  dataset: DicomJsonDataset,
  tag: string
): DicomJsonDataset[] | undefined {
  const value = dataset[tag]?.Value;
  return Array.isArray(value) ? (value as DicomJsonDataset[]) : undefined;
}
