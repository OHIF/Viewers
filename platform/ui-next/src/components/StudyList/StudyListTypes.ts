import type { WorkflowId } from './WorkflowsInfer';

export type StudyRow = {
  studyInstanceUid: string;
  patient: string;
  mrn: string;
  studyDateTime: string;
  modalities: string;
  description: string;
  accession: string;
  instances: number;
  /** Optional, data-driven list of available workflows for this study (immutable) */
  workflows?: readonly WorkflowId[];
};
