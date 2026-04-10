export interface HubConfig {
  name: string;
  friendlyName?: string;
  productName?: string;
  enabled: boolean;
  events: string[];
  lease: number;
  hub_endpoint: string;
  authorization_endpoint?: string;
  token_endpoint: string;
  client_id?: string;
  client_secret?: string;
  token?: string;
  subscriberName?: string;
  topic?: string;
  subscribed?: boolean;
  resubscribeRequested?: boolean;
  websocket?: WebSocket | null;
  lastPublishedMessageID?: string;
}

/** Context key used in cast event context arrays (e.g. 'annotation', 'measurement', 'patient', 'study', 'conference'). */
export type ContextKey = 'annotation' | 'measurement' | 'patient' | 'study' | 'conference';

export interface EventContextItem<T = unknown> {
  key: string;
  resource: T;
}

/** Annotation resource shape in cast annotation-update / annotation-delete events. */
export interface AnnotationResource {
  resourceType?: string;
  uid: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  measurement?: MeasurementResource;
}

/** Measurement resource shape in cast measurement-update events. */
export interface MeasurementResource {
  resourceType?: string;
  uid: string;
  toolName?: string;
  label?: string;
  referenceStudyUID?: string;
  referenceSeriesUID?: string;
  displaySetInstanceUID?: string;
  frameNumber?: number;
  referencedImageId?: string;
  FrameOfReferenceUID?: string;
  modifiedTimestamp?: number;
  annotation?: { data?: Record<string, unknown>; metadata?: Record<string, unknown> };
  data?: Record<string, unknown>;
  points?: unknown[];
  type?: string;
  displayText?: Record<string, unknown>;
  isLocked?: boolean;
  [key: string]: unknown;
}

/** Patient context resource (identifier array). */
export interface PatientContextResource {
  identifier?: Array<{ value: string }>;
}

/** Study context resource (uid). */
export interface StudyContextResource {
  uid?: string;
}

/** Conference context resource (conference-start event). */
export interface ConferenceResource {
  title?: string;
  participants?: string[];
}

export interface CastMessage {
  id?: string;
  timestamp?: string;
  event?: {
    'hub.event': string;
    'hub.topic'?: string;
    context?: EventContextItem<unknown>[];
  };
}

export interface CastClientConfig {
  hubs?: HubConfig[];
  defaultHub?: string;
  productName?: string;
  callbackUrl?: string;
  autoStart?: boolean;
  autoReconnect?: boolean;
}
