import dcmjs from 'dcmjs';

import { UpsClient, SubscriptionHandle, WorkitemEvent } from './UpsClient';
import {
  DicomJsonDataset,
  ProcedureStepState,
  TAG,
  WorkitemCode,
  getSequence,
  getString,
} from './types';

/**
 * The UPS-RS role logic of a Task Requester + Watcher (PS3.18 11.1): search the
 * tasks of a study, create one when the study has none for that code, request
 * the cancellation of a queued one, watch its state, and read the results it
 * names. Assigning a performer and stepping a workitem state belong to the Task
 * Manager, never here. Ported from the Weasis `weasis-dicom-aiw` module.
 */
export class UpsService {
  constructor(
    private readonly client: UpsClient,
    private readonly aeTitle?: string
  ) {}

  /**
   * Searches the workitems of a study (PS3.18 11.9, RAD-81). The study is
   * matched through the Referenced Request Sequence, never the Input Information
   * Sequence: (0040,A370) is a Required matching key where (0040,4021) is
   * Optional (PS3.4 Table CC.2.5-3).
   */
  search(
    studyUid: string,
    patientId?: string,
    accessionNumber?: string
  ): Promise<DicomJsonDataset[]> {
    if (!studyUid) {
      throw new Error('Study Instance UID cannot be null');
    }
    return this.client.searchWorkitems({
      studyInstanceUid: studyUid,
      patientId: patientId || undefined,
      accessionNumber: accessionNumber || undefined,
      includeAllFields: true,
    });
  }

  /**
   * Creates the workitem of a task when the study has none for that code
   * (PS3.18 11.4, RAD-80). Non-terminal means SCHEDULED or IN PROGRESS;
   * COMPLETED and CANCELED do not suppress a new task.
   */
  async run(
    catalogEntry: WorkitemCode,
    study: DicomJsonDataset,
    instances: DicomJsonDataset[]
  ): Promise<string> {
    const studyUid = getString(study, TAG.StudyInstanceUID);
    if (!studyUid) {
      throw new Error('The study has no Study Instance UID');
    }
    const pending = await this.nonTerminalWorkitem(studyUid, catalogEntry);
    if (pending) {
      const uid = getString(pending, TAG.SOPInstanceUID);
      if (uid) {
        return uid;
      }
    }
    const workitemUid = mintUid();
    return this.client.createWorkitem(workitemUid, buildWorkitem(catalogEntry, study, instances));
  }

  private async nonTerminalWorkitem(
    studyUid: string,
    catalogEntry: WorkitemCode
  ): Promise<DicomJsonDataset | undefined> {
    for (const workitem of await this.search(studyUid)) {
      if (
        UpsService.isNonTerminal(getString(workitem, TAG.ProcedureStepState)) &&
        hasCode(workitem, catalogEntry)
      ) {
        return workitem;
      }
    }
    return undefined;
  }

  /** SCHEDULED and IN PROGRESS are the two states a Task Requestor reckons with. */
  static isNonTerminal(state: string | undefined): boolean {
    return state === ProcedureStepState.SCHEDULED || state === ProcedureStepState.IN_PROGRESS;
  }

  /** Requests the cancellation of a SCHEDULED workitem (PS3.18 11.8). */
  cancel(workitemUid: string, reasonCode?: WorkitemCode): Promise<void> {
    const dataset: DicomJsonDataset = reasonCode
      ? {
          [TAG.ReasonForCancellation]: {
            vr: 'SQ',
            Value: [
              {
                [TAG.CodeValue]: { vr: 'SH', Value: [reasonCode.codeValue] },
                [TAG.CodingSchemeDesignator]: {
                  vr: 'SH',
                  Value: [reasonCode.codingSchemeDesignator],
                },
                ...(reasonCode.codeMeaning
                  ? { [TAG.CodeMeaning]: { vr: 'LO', Value: [reasonCode.codeMeaning] } }
                  : {}),
              },
            ],
          },
        }
      : {};
    return this.client.cancelWorkitem(workitemUid, dataset);
  }

  /** Subscribes to a workitem's events and forwards each report to `listener`. */
  watch(workitemUid: string, listener: (event: WorkitemEvent) => void): SubscriptionHandle {
    const aeTitle = this.aeTitle;
    if (!aeTitle) {
      throw new Error('An AE Title is required to subscribe to a workitem');
    }
    return this.client.subscribe(workitemUid, aeTitle, listener);
  }

  /** Removes this AE Title from a workitem's subscribers (PS3.18 11.10.4). */
  unsubscribe(workitemUid: string): Promise<void> {
    const aeTitle = this.aeTitle;
    if (!aeTitle) {
      throw new Error('An AE Title is required to unsubscribe from a workitem');
    }
    return this.client.unsubscribe(workitemUid, aeTitle);
  }

  /**
   * Reads the results named by the Output Information Sequence (0040,4033) of a
   * workitem (PS3.18 11.5, RAD-83). The sequence lives INSIDE the Unified
   * Procedure Step Performed Procedure Sequence (0074,1216), not at the top level
   * (PS3.3 Table C.30.3-1). Returns one entry per series, keyed by Series
   * Instance UID (the empty key when the performer named no series).
   */
  async loadOutputs(workitemUid: string): Promise<Map<string, DicomJsonDataset[]>> {
    const workitem = await this.client.retrieveWorkitem(workitemUid);
    const outputs = new Map<string, DicomJsonDataset[]>();
    const items = outputSequence(workitem);
    if (!items) {
      return outputs;
    }
    for (const item of items) {
      const referenced = getSequence(item, TAG.ReferencedSOPSequence);
      const sops: DicomJsonDataset[] = [];
      if (referenced && referenced.length > 0) {
        sops.push(...referenced);
      } else if (getString(item, TAG.ReferencedSOPInstanceUID)) {
        sops.push(item);
      }
      if (sops.length === 0) {
        continue;
      }
      const seriesUid = getString(item, TAG.SeriesInstanceUID) ?? '';
      const existing = outputs.get(seriesUid) ?? [];
      existing.push(...sops);
      outputs.set(seriesUid, existing);
    }
    return outputs;
  }

  /** The SOP Instance UIDs of the results of a workitem, for the caller to load. */
  async outputInstanceUids(workitemUid: string): Promise<string[]> {
    const outputs = await this.loadOutputs(workitemUid);
    const uids: string[] = [];
    for (const instances of outputs.values()) {
      for (const sop of instances) {
        const uid = getString(sop, TAG.ReferencedSOPInstanceUID);
        if (uid) {
          uids.push(uid);
        }
      }
    }
    return uids;
  }

  /** The state a Task Requestor distinguishes, for the caller to pick a menu entry. */
  static stateOf(workitem: DicomJsonDataset): ProcedureStepState | null {
    const state = getString(workitem, TAG.ProcedureStepState);
    if (!state) {
      return null;
    }
    const value = Object.values(ProcedureStepState).find(v => v === state);
    return (value as ProcedureStepState) ?? null;
  }

  /** Whether the workitem names results in its Output Information Sequence. */
  static hasOutputs(workitem: DicomJsonDataset): boolean {
    const items = outputSequence(workitem);
    return items !== undefined && items.length > 0;
  }
}

/** The Output Information Sequence of a workitem, read from its conformant place. */
function outputSequence(workitem: DicomJsonDataset): DicomJsonDataset[] | undefined {
  const performed = getSequence(workitem, TAG.UnifiedProcedureStepPerformedProcedureSequence);
  if (!performed || performed.length === 0) {
    return undefined;
  }
  return getSequence(performed[0], TAG.OutputInformationSequence);
}

/** Whether a workitem's Scheduled Workitem Code Sequence carries the expected code. */
function hasCode(workitem: DicomJsonDataset, expected: WorkitemCode): boolean {
  const codes = getSequence(workitem, TAG.ScheduledWorkitemCodeSequence);
  if (!codes) {
    return false;
  }
  return codes.some(
    code =>
      getString(code, TAG.CodeValue) === expected.codeValue &&
      getString(code, TAG.CodingSchemeDesignator) === expected.codingSchemeDesignator
  );
}

/** Mints a workitem SOP Instance UID with OHIF's DICOM UID generator (dcmjs). */
function mintUid(): string {
  return dcmjs.data.DicomMetaDictionary.uid();
}

/** A DICOM DT timestamp of the current moment (YYYYMMDDHHMMSS). */
function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** Builds a minimal conformant UPS workitem dataset (PS3.3 C.30.1/C.30.2). */
function buildWorkitem(
  catalogEntry: WorkitemCode,
  study: DicomJsonDataset,
  instances: DicomJsonDataset[]
): DicomJsonDataset {
  const dataset: DicomJsonDataset = {
    [TAG.ScheduledWorkitemCodeSequence]: {
      vr: 'SQ',
      Value: [
        {
          [TAG.CodeValue]: { vr: 'SH', Value: [catalogEntry.codeValue] },
          [TAG.CodingSchemeDesignator]: { vr: 'SH', Value: [catalogEntry.codingSchemeDesignator] },
          ...(catalogEntry.codeMeaning
            ? { [TAG.CodeMeaning]: { vr: 'LO', Value: [catalogEntry.codeMeaning] } }
            : {}),
        },
      ],
    },
    [TAG.InputInformationSequence]: {
      vr: 'SQ',
      Value: instances.map(instance => {
        const item: DicomJsonDataset = {};
        const studyUid =
          getString(instance, TAG.StudyInstanceUID) ?? getString(study, TAG.StudyInstanceUID);
        if (studyUid) {
          item[TAG.StudyInstanceUID] = { vr: 'UI', Value: [studyUid] };
        }
        const seriesUid = getString(instance, TAG.SeriesInstanceUID);
        if (seriesUid) {
          item[TAG.SeriesInstanceUID] = { vr: 'UI', Value: [seriesUid] };
        }
        const classUid =
          getString(instance, TAG.ReferencedSOPClassUID) ?? getString(instance, TAG.SOPClassUID);
        if (classUid) {
          item[TAG.ReferencedSOPClassUID] = { vr: 'UI', Value: [classUid] };
        }
        const sopUid =
          getString(instance, TAG.ReferencedSOPInstanceUID) ??
          getString(instance, TAG.SOPInstanceUID);
        if (sopUid) {
          item[TAG.ReferencedSOPInstanceUID] = { vr: 'UI', Value: [sopUid] };
        }
        return item;
      }),
    },
  };
  const requestItem: DicomJsonDataset = {};
  const studyUid = getString(study, TAG.StudyInstanceUID);
  if (studyUid) {
    requestItem[TAG.StudyInstanceUID] = { vr: 'UI', Value: [studyUid] };
  }
  const accessionNumber = getString(study, TAG.AccessionNumber);
  if (accessionNumber) {
    requestItem[TAG.AccessionNumber] = { vr: 'SH', Value: [accessionNumber] };
  }
  dataset[TAG.ReferencedRequestSequence] = { vr: 'SQ', Value: [requestItem] };
  for (const tag of [TAG.PatientID, TAG.PatientName]) {
    const value = getString(study, tag);
    if (value) {
      dataset[tag] = { vr: 'LO', Value: [value] };
    }
  }
  dataset[TAG.ProcedureStepState] = { vr: 'CS', Value: [ProcedureStepState.SCHEDULED] };
  dataset[TAG.UPSPriority] = { vr: 'CS', Value: ['MEDIUM'] };
  dataset[TAG.ScheduledWorkitemLabel] = {
    vr: 'SH',
    Value: [catalogEntry.codeMeaning || catalogEntry.codeValue],
  };
  dataset[TAG.ScheduledProcedureStepStartDateTime] = { vr: 'DT', Value: [nowStamp()] };
  dataset[TAG.PerformedWorkitemStatus] = { vr: 'CS', Value: ['READY'] };
  return dataset;
}
