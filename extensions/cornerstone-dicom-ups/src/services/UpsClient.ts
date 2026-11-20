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

/**
 * One caller watching a subscription resource. The handle resolves only when
 * the shared subscription is ready, so a joiner never waits less than the
 * first subscriber did.
 */
interface Watcher {
  onEvent: (event: WorkitemEvent) => void;
  onError: () => void;
  /** Set by `close()`; a closed watcher receives neither event nor error. */
  closed: boolean;
  resolveHandle: (handle: SubscriptionHandle) => void;
}

/**
 * The live subscription of one (workitem UID, AE Title) pair: one POST and one
 * notification channel shared by every watcher of that pair.
 */
interface SubscriptionEntry {
  uid: string;
  aeTitle: string;
  ws: WebSocket | undefined;
  /** Set before a deliberate close, so `onclose` stays silent about it. */
  intentional: boolean;
  ready: boolean;
  watchers: Watcher[];
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

  /**
   * Best-effort subscription cleanups, serialized per resource. Each entry is
   * the TAIL of that resource's cleanup chain: a subscribe or retry chains its
   * POST after this tail, so no stale DELETE - however many failed setups or
   * closes happened in between - can remove a renewed subscription.
   */
  private readonly cleanupChain = new Map<string, Promise<void>>();

  /**
   * Live subscriptions keyed by `resourceKey`. A subscription belongs to the
   * resource `/workitems/{workitemUid}/subscribers/{aeTitle}` (PS3.18 11.10.2),
   * and the channel belongs to the AE Title (PS3.18 8.10.4), so every watcher
   * of one pair must share a single POST and a single channel: a per-watcher
   * subscription would let one watcher's cleanup remove the other's origin
   * subscription.
   */
  private readonly registry = new Map<string, SubscriptionEntry>();

  /** How long a subscribe waits for a pending cleanup before giving up. */
  private static readonly CLEANUP_WAIT_MS = 5000;

  /** The DICOMweb base URL with any trailing slashes stripped. */
  private get baseUrl(): string {
    return this.config.baseUrl.replace(/\/+$/, '');
  }

  /** http(s) base rewritten to ws(s) for the notification channel. */
  private wsUrl(path: string): string {
    return `${this.baseUrl.replace(/^http/, 'ws')}${path}`;
  }

  /** The map key for one subscription resource: workitem UID + AE Title. */
  private resourceKey(workitemUid: string, aeTitle: string): string {
    return `${workitemUid}\u0000${aeTitle}`;
  }

  /** Appends a best-effort DELETE to the resource's cleanup chain. */
  private enqueueCleanup(workitemUid: string, aeTitle: string): void {
    const key = this.resourceKey(workitemUid, aeTitle);
    const prev = this.cleanupChain.get(key) ?? Promise.resolve();
    const next = prev
      .catch(() => {})
      .then(() => this.unsubscribe(workitemUid, aeTitle))
      .catch(() => {});
    this.cleanupChain.set(key, next);
    // A settled tail removes itself, but only while it is still the tail: a
    // newer queued cleanup must stay in the map.
    void next.then(() => {
      if (this.cleanupChain.get(key) === next) {
        this.cleanupChain.delete(key);
      }
    });
  }

  /** Resolves true once the tail settles, false after `ms` elapses. */
  private settleOrTimeout(tail: Promise<void>, ms: number): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const timer = setTimeout(() => resolve(false), ms);
      tail.then(
        () => {
          clearTimeout(timer);
          resolve(true);
        },
        () => {
          clearTimeout(timer);
          resolve(true);
        }
      );
    });
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
   * Waits until the per-resource cleanup chain is quiet: re-reads the tail
   * after each settle, because a close() or failure-path cleanup queued
   * during the wait must be drained too. One overall deadline bounds it.
   */
  private async waitForQuiet(key: string): Promise<boolean> {
    const deadline = Date.now() + UpsClient.CLEANUP_WAIT_MS;
    for (;;) {
      const tail = this.cleanupChain.get(key);
      if (!tail) {
        return true;
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0 || !(await this.settleOrTimeout(tail, remaining))) {
        return false;
      }
    }
  }

  /**
   * Subscribes to a workitem (PS3.18 11.10) and opens its notification
   * channel (PS3.18 8.10.4). The subscription is created with POST first - a
   * conformant origin requires it before the channel can carry events - then
   * the WebSocket is opened at the Open Notification Connection resource,
   * not on the subscription resource itself.
   *
   * The first subscriber of a (workitem UID, AE Title) pair performs both
   * steps; later subscribers of the same pair join the shared channel instead
   * of creating a second subscription. `onError` fires when the setup or the
   * channel fails, so every watcher can fall back to polling.
   */
  subscribe(
    workitemUid: string,
    aeTitle: string,
    onEvent: (event: WorkitemEvent) => void,
    onError?: () => void
  ): Promise<SubscriptionHandle> {
    const key = this.resourceKey(workitemUid, aeTitle);
    const entry = this.registry.get(key);
    const handlePromise = new Promise<SubscriptionHandle>(resolveHandle => {
      const watcher: Watcher = {
        onEvent,
        onError: onError ?? (() => {}),
        closed: false,
        resolveHandle,
      };
      if (entry) {
        entry.watchers.push(watcher);
        if (entry.ready) {
          resolveHandle(this.watcherHandle(key, entry, watcher));
        }
        return;
      }
      const created = this.createEntry(key, workitemUid, aeTitle);
      created.watchers.push(watcher);
      this.startEntry(key, created);
    });
    return handlePromise;
  }

  /** The handle of one watcher; `close()` releases only that watcher's slot. */
  private watcherHandle(
    key: string,
    entry: SubscriptionEntry,
    watcher: Watcher
  ): SubscriptionHandle {
    if (watcher.closed) {
      // The setup resolved the same watcher after a close() that ran while the
      // entry was still pending: the no-op handle mirrors that closed state.
      return { close: () => {} };
    }
    return { close: () => this.releaseWatcher(key, entry, watcher) };
  }

  /** Registers a pending entry before any request is issued. */
  private createEntry(key: string, uid: string, aeTitle: string): SubscriptionEntry {
    const entry: SubscriptionEntry = {
      uid,
      aeTitle,
      ws: undefined,
      intentional: false,
      ready: false,
      watchers: [],
    };
    // Registered before the setup starts: a concurrent subscribe of the same
    // pair must observe this entry and join it rather than issue a second POST.
    this.registry.set(key, entry);
    return entry;
  }

  /** Drops one watcher; the last one closes the channel and deletes the subscription. */
  private releaseWatcher(
    key: string,
    entry: SubscriptionEntry,
    watcher: Watcher
  ): void {
    if (watcher.closed) {
      return;
    }
    watcher.closed = true;
    this.removeWatcher(entry, watcher);
    if (entry.watchers.length === 0) {
      this.releaseEntry(key, entry);
    }
  }

  /** Closes and prunes an entry whose last watcher is gone. */
  private releaseEntry(key: string, entry: SubscriptionEntry): void {
    // Everything below is synchronous on purpose: the window between "no
    // watchers" and "entry pruned" must not admit a join on a dying entry.
    this.forgetEntry(key, entry);
    entry.intentional = true;
    entry.ws?.close();
    if (entry.ready) {
      // Only a subscription the origin actually holds needs the DELETE; a
      // setup that never completed cleans up on its own failure path.
      this.enqueueCleanup(entry.uid, entry.aeTitle);
    }
  }

  /** Removes one watcher from the entry's list. */
  private removeWatcher(entry: SubscriptionEntry, watcher: Watcher): void {
    const index = entry.watchers.indexOf(watcher);
    if (index >= 0) {
      entry.watchers.splice(index, 1);
    }
  }

  /** Prunes an entry, unless the registry already holds a newer one for the key. */
  private forgetEntry(key: string, entry: SubscriptionEntry): void {
    if (this.registry.get(key) === entry) {
      this.registry.delete(key);
    }
  }

  /**
   * Runs the setup of a fresh entry: bounded quiet-wait, POST, channel, then
   * handle resolution. Written as a then/catch chain rather than try/await:
   * this project's Babel config cannot transpile an optional catch binding
   * inside an async body.
   */
  private startEntry(key: string, entry: SubscriptionEntry): void {
    const aeTitle = entry.aeTitle;
    const workitemUid = entry.uid;
    // A pending best-effort cleanup of this SAME resource is awaited (bounded)
    // before the POST, so a retry lands only after the stale subscription is
    // gone and the cleanup cannot delete a renewed subscription.
    this.waitForQuiet(key)
      .then(settled => {
        if (!settled) {
          // A stale cleanup is still in flight after the bound: do not POST,
          // or the outstanding DELETE could later remove the renewed
          // subscription. Signal failure so every watcher polls instead.
          throw new Error('UPS-RS cleanup did not settle before the subscribe deadline');
        }
        // 1. Create the subscription (PS3.18 11.10.2). POST, no payload.
        return this.request(
          `/workitems/${encodeURIComponent(workitemUid)}/subscribers/${encodeURIComponent(aeTitle)}`,
          { method: 'POST' }
        );
      })
      .then(() => {
        // The POST succeeded, so the origin now holds the subscription. A
        // failure below must DELETE it, or it leaks until something else
        // removes it.
        entry.ready = true;
        entry.ws = this.openChannel(key, entry);
        for (const watcher of [...entry.watchers]) {
          this.settleWatcher(key, entry, watcher);
        }
      })
      .catch(() => {
        // Record the cleanup BEFORE signalling: a synchronous retry then sees
        // the pending DELETE and chains its POST after it. The cleanup is
        // still fire-and-forget, so the polling fallback does not wait for it.
        const hadSubscription = this.registry.get(key) === entry && entry.ready;
        this.forgetEntry(key, entry);
        if (hadSubscription) {
          this.enqueueCleanup(workitemUid, aeTitle);
        }
        const watchers = [...entry.watchers];
        entry.watchers.length = 0;
        for (const watcher of watchers) {
          this.failWatcher(watcher);
        }
      });
  }

  /** Opens the AE Title's channel and wires it to the entry's watchers. */
  private openChannel(key: string, entry: SubscriptionEntry): WebSocket {
    const aeTitle = entry.aeTitle;
    // 2. Open the notification channel (PS3.18 8.10.4). The channel is scoped
    // to the AE Title, not to one workitem, so a frame is forwarded only when
    // it names the entry's workitem.
    const ws = this.deps.openWebSocket(this.wsUrl(`/subscribers/${encodeURIComponent(aeTitle)}`));
    ws.onmessage = event => {
      // Parsed once per frame, then fanned out: the subscription is shared,
      // so every live watcher of the pair sees the same notification.
      const parsed = parseWorkitemEvent(String(event.data));
      if (!parsed) {
        return;
      }
      if (parsed.affectedSopInstanceUid !== entry.uid) {
        return;
      }
      for (const watcher of [...entry.watchers]) {
        if (!watcher.closed) {
          watcher.onEvent(parsed);
        }
      }
    };
    ws.onerror = () => {
      // The browser WebSocket API exposes no status code; onclose forwards
      // both a failed handshake and a mid-watch drop to onError exactly once.
    };
    ws.onclose = () => {
      // A failed handshake and an unexpected mid-watch close both leave the
      // channel unusable, so every watcher falls back to polling. The origin
      // subscription is deliberately left in place: a renewed subscribe POSTs
      // again, which is idempotent, and a DELETE here could race that POST.
      if (entry.intentional) {
        return;
      }
      this.forgetEntry(key, entry);
      const watchers = [...entry.watchers];
      entry.watchers.length = 0;
      for (const watcher of watchers) {
        this.failWatcher(watcher);
      }
    };
    return ws;
  }

  /** Hands a watcher its handle once the shared subscription is ready. */
  private settleWatcher(key: string, entry: SubscriptionEntry, watcher: Watcher): void {
    if (!watcher.closed) {
      watcher.resolveHandle(this.watcherHandle(key, entry, watcher));
    }
  }

  /** Signals one watcher's fallback and settles it with a no-op handle. */
  private failWatcher(watcher: Watcher): void {
    if (watcher.closed) {
      return;
    }
    watcher.closed = true;
    watcher.resolveHandle({ close: () => {} });
    watcher.onError();
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
