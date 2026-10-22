import { DicomJsonDataset, TAG, UpsConfig, getString } from './types';

/** The searchable keys of a study's workitems (PS3.18 11.9, RAD-81). */
export interface WorkitemSearch {
  studyInstanceUid: string;
  patientId?: string;
  accessionNumber?: string;
  includeAllFields?: boolean;
}

/** A parsed N-EVENT-REPORT delivered over the notification channel. */
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
  constructor(
    private readonly config: UpsConfig,
    private readonly deps: UpsClientDeps = defaultDeps
  ) {}

  private get baseUrl(): string {
    return this.config.baseUrl.replace(/\/+$/, '');
  }

  /** http(s) base rewritten to ws(s) for the notification channel. */
  private wsUrl(path: string): string {
    return `${this.baseUrl.replace(/^http/, 'ws')}${path}`;
  }

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
   * Opens the notification channel of a workitem (PS3.18 11.10, RAD-86).
   * `onError` fires when the channel never opens - an origin without a
   * WebSocket notification channel (e.g. dcm4chee-arc) rejects the handshake
   * and the browser exposes no status code - so the caller can fall back to
   * polling.
   */
  subscribe(
    workitemUid: string,
    aeTitle: string,
    onEvent: (event: WorkitemEvent) => void,
    onError?: () => void
  ): SubscriptionHandle {
    let opened = false;
    const ws = this.deps.openWebSocket(
      this.wsUrl(
        `/workitems/${encodeURIComponent(workitemUid)}/subscribers/${encodeURIComponent(aeTitle)}`
      )
    );
    ws.onopen = () => {
      opened = true;
    };
    ws.onmessage = event => {
      const dataset = JSON.parse(String(event.data)) as DicomJsonDataset;
      const raw = getString(dataset, TAG.EventTypeID);
      onEvent({
        eventTypeId: raw ? parseInt(raw, 10) : 0,
        affectedSopInstanceUid: getString(dataset, TAG.AffectedSOPInstanceUID),
        dataset,
      });
    };
    ws.onerror = () => {
      // The browser WebSocket API exposes no status code; a channel that never
      // opens is the only signal, and onclose forwards it once.
    };
    ws.onclose = () => {
      if (!opened) {
        onError?.();
      }
    };
    return { close: () => ws.close() };
  }

  /** Removes the subscription of this AE Title (PS3.18 11.10.4). */
  async unsubscribe(workitemUid: string, aeTitle: string): Promise<void> {
    await this.request(
      `/workitems/${encodeURIComponent(workitemUid)}/subscribers/${encodeURIComponent(aeTitle)}`,
      { method: 'DELETE' }
    );
  }
}
