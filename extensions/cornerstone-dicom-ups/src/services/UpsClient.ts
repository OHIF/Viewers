import { DicomJsonDataset, TAG, UpsConfig } from './types';

/** The searchable keys of a study's workitems (PS3.18 11.9, RAD-81). */
export interface WorkitemSearch {
  studyInstanceUid: string;
  patientId?: string;
  accessionNumber?: string;
  includeAllFields?: boolean;
}

/** One workitem state notification delivered to a watcher. */
export interface WorkitemEvent {
  eventTypeId: number;
  affectedSopInstanceUid?: string;
  dataset: DicomJsonDataset;
}

/** A handle that closes the notification channel. */
export interface SubscriptionHandle {
  close(): void;
}

/** Injectable transport, so the tests can run without the network. */
export interface UpsClientDeps {
  fetchImpl: typeof fetch;
  openWebSocket: (url: string) => WebSocket;
}

// Lazy by design: the globals are only read when a caller relies on the
// defaults, so importing this module never throws in an environment without
// `fetch`/`WebSocket` (e.g. jest + jsdom).
const defaultDeps: UpsClientDeps = {
  fetchImpl: (input, init) => fetch(input, init),
  openWebSocket: url => new WebSocket(url),
};

/**
 * The DICOMweb UPS-RS wire layer (PS3.18 11): Create Workitem (11.4), Retrieve
 * Workitem (11.5), Request Cancellation (11.8), Search Workitems (11.9),
 * Subscribe / Unsubscribe (11.10). It carries no role logic.
 */
export class UpsClient {
  /** Injects the DICOMweb settings and the transport used for all requests. */
  constructor(
    private readonly config: UpsConfig,
    private readonly deps: UpsClientDeps = defaultDeps
  ) {}

  /** The DICOMweb base URL with any trailing slashes stripped. */
  private get baseUrl(): string {
    return this.config.baseUrl.replace(/\/+$/, '');
  }

  /** http(s) base rewritten to ws(s) for the notification channel. */
  private wsUrl(path: string): string {
    return `${this.baseUrl.replace(/^http/, 'ws')}${path}`;
  }

  /** Sends a request to the origin and throws when the response is not 2xx. */
  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const response = await this.deps.fetchImpl(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `UPS-RS ${init.method ?? 'GET'} ${path} failed: ${response.status} ${body.slice(0, 300)}`
      );
    }
    return response;
  }

  /**
   * Creates a workitem (PS3.18 11.4, RAD-80). The SOP Instance UID is minted by
   * the caller and travels in the `workitem` query parameter (11.4.1.1): a bare
   * POST /workitems is ambiguous with Search-with-body (11.9).
   */
  async createWorkitem(workitemUid: string, dataset: DicomJsonDataset): Promise<string> {
    await this.request(`/workitems?workitem=${encodeURIComponent(workitemUid)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/dicom+json' },
      body: JSON.stringify(dataset),
    });
    return workitemUid;
  }

  /** Searches the workitems of a study (PS3.18 11.9, RAD-81). */
  async searchWorkitems(query: WorkitemSearch): Promise<DicomJsonDataset[]> {
    const params: string[] = [];
    if (query.patientId) {
      params.push(`${TAG.PatientID}=${encodeURIComponent(query.patientId)}`);
    }
    if (query.accessionNumber) {
      params.push(`0040A370.${TAG.AccessionNumber}=${encodeURIComponent(query.accessionNumber)}`);
    }
    params.push(`0040A370.${TAG.StudyInstanceUID}=${encodeURIComponent(query.studyInstanceUid)}`);
    if (query.includeAllFields) {
      params.push('includefield=all');
    }
    const response = await this.request(`/workitems?${params.join('&')}`, {
      headers: { Accept: 'application/dicom+json' },
    });
    if (response.status === 204) {
      // PS3.18 11.9: an empty result may be 204 No Content with no body.
      return [];
    }
    return (await response.json()) as DicomJsonDataset[];
  }

  /** Retrieves a workitem (PS3.18 11.5, RAD-83). */
  async retrieveWorkitem(workitemUid: string): Promise<DicomJsonDataset> {
    const response = await this.request(`/workitems/${encodeURIComponent(workitemUid)}`, {
      headers: { Accept: 'application/dicom+json' },
    });
    return (await response.json()) as DicomJsonDataset;
  }

  /** Requests the cancellation of a SCHEDULED workitem (PS3.18 11.8). */
  async cancelWorkitem(workitemUid: string, dataset: DicomJsonDataset = {}): Promise<void> {
    await this.request(`/workitems/${encodeURIComponent(workitemUid)}/cancelrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/dicom+json' },
      body: JSON.stringify(dataset),
    });
  }

  /**
   * Subscribes to a workitem (PS3.18 11.10) and opens its notification
   * channel (PS3.18 8.10.4). The subscription is created with POST first - a
   * conformant origin requires it before the channel can carry events - then
   * the WebSocket is opened at the Open Notification Connection resource,
   * not on the subscription resource itself. `onError` fires when either
   * step fails, so the caller can fall back to polling.
   */
  subscribe(
    workitemUid: string,
    aeTitle: string,
    onEvent: (event: WorkitemEvent) => void,
    onError?: () => void
  ): Promise<SubscriptionHandle> {
    // 1. Create the subscription (PS3.18 11.10). POST, no payload. Written as
    // a then/catch chain rather than try/await: this project's Babel config
    // cannot transpile an optional catch binding inside an async body.
    let subscribed = false;
    return this.request(
      `/workitems/${encodeURIComponent(workitemUid)}/subscribers/${encodeURIComponent(aeTitle)}`,
      { method: 'POST' }
    )
      .then(() => {
        // The POST succeeded, so the origin now holds the subscription. If the
        // channel step below throws, the catch must DELETE it - otherwise the
        // subscription leaks until something else removes it.
        subscribed = true;
        // 2. Open the notification channel (PS3.18 8.10.4). The channel is
        // scoped to the AE Title, not to one workitem, so a frame is
        // forwarded only when it names the subscribed workitem.
        let intentional = false;
        const ws = this.deps.openWebSocket(
          this.wsUrl(`/subscribers/${encodeURIComponent(aeTitle)}`)
        );
        ws.onmessage = event => {
          const parsed = parseWorkitemEvent(String(event.data));
          if (!parsed) {
            return;
          }
          if (parsed.affectedSopInstanceUid !== workitemUid) {
            return;
          }
          onEvent(parsed);
        };
        ws.onerror = () => {
          // The browser WebSocket API exposes no status code; onclose forwards
          // both a failed handshake and a mid-watch drop to onError exactly once.
        };
        ws.onclose = () => {
          // A failed handshake and an unexpected mid-watch close both signal a
          // channel that is no longer usable, so the caller falls back to
          // polling. A deliberate close() sets `intentional` first and stays
          // silent here.
          if (!intentional) {
            onError?.();
          }
        };
        return {
          close: () => {
            intentional = true;
            ws.close();
            void this.unsubscribe(workitemUid, aeTitle).catch(() => {});
          },
        };
      })
      .catch(() => {
        // The POST succeeded but the channel step threw (a browser throws for
        // a mixed-content ws:// or an invalid URL). Remove the subscription the
        // origin still holds BEFORE signalling, so a retry that POSTs the same
        // resource cannot be undone by this DELETE landing after it.
        if (subscribed) {
          void this.unsubscribe(workitemUid, aeTitle)
            .catch(() => {})
            .then(() => onError?.());
        } else {
          onError?.();
        }
        return { close: () => {} };
      });
  }

  /** Removes the subscription of this AE Title (PS3.18 11.10.4). */
  async unsubscribe(workitemUid: string, aeTitle: string): Promise<void> {
    await this.request(
      `/workitems/${encodeURIComponent(workitemUid)}/subscribers/${encodeURIComponent(aeTitle)}`,
      { method: 'DELETE' }
    );
  }
}

/**
 * Reads the first string of a DICOM JSON attribute value, e.g.
 * `{ "00741000": { "vr": "CS", "Value": ["IN PROGRESS"] } }`.
 */
function dicomJsonString(attribute: unknown): string | undefined {
  if (attribute && typeof attribute === 'object') {
    const value = (attribute as { Value?: unknown }).Value;
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
  }
  return undefined;
}

/**
 * Reads the first numeric value of a DICOM JSON attribute, e.g.
 * `{ "00001002": { "vr": "US", "Value": [1] } }`.
 */
function dicomJsonNumber(attribute: unknown): number | undefined {
  if (attribute && typeof attribute === 'object') {
    const value = (attribute as { Value?: unknown }).Value;
    if (Array.isArray(value) && typeof value[0] === 'number') {
      return value[0];
    }
  }
  return undefined;
}

/**
 * Normalizes one notification-channel frame into a WorkitemEvent.
 *
 * The payload is a DICOM JSON Event Report (PS3.18 8.10.5.1.1): the affected
 * workitem is (0000,1000) Affected SOP Instance UID, the event type is
 * (0000,1002) Event Type ID, and the state is (0074,1000) Procedure Step
 * State. Only those three are normalized.
 */
function parseWorkitemEvent(payload: string): WorkitemEvent | undefined {
  let frame: Record<string, unknown> | undefined;
  try {
    frame = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return undefined;
  }
  if (!frame || typeof frame !== 'object') {
    return undefined;
  }
  const affectedSopInstanceUid = dicomJsonString(frame['00001000']);
  const eventTypeId = dicomJsonNumber(frame['00001002']) ?? 0;
  const state = dicomJsonString(frame['00741000']);
  return {
    eventTypeId,
    affectedSopInstanceUid,
    dataset: state ? { [TAG.ProcedureStepState]: { vr: 'CS', Value: [state] } } : {},
  };
}
