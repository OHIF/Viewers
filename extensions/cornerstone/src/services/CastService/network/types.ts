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

export interface CastMessage {
  id?: string;
  timestamp?: string;
  event?: {
    'hub.event': string;
    'hub.topic'?: string;
    context?: Array<{ key: string; resource: unknown }>;
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
