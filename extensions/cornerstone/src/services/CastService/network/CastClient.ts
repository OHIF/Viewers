import type { HubConfig, CastMessage, CastClientConfig } from './types';
import { generateMessageId } from '../utils/generateMessageId';
import { RECONNECT_INTERVAL_MS, SUBSCRIBE_TIMEOUT_MS } from '../constants';

export interface CastTransport {
  getHub(): HubConfig;
  sendGetResponse(requestId: string, data: unknown, topic?: string): void;
}

export class CastClient implements CastTransport {
  private _config: CastClientConfig;
  private _hub: HubConfig;
  private _reconnectInterval: ReturnType<typeof setInterval> | null = null;
  private _onMessageCallback: ((message: CastMessage) => void) | null = null;

  constructor(config: CastClientConfig = {}) {
    this._config = config;
    this._hub = this._createEmptyHub();

    if (config.hubs?.length && config.defaultHub) {
      this.setHub(config.defaultHub);
    }

    if (config.autoStart && this._hub.name) {
      this.getToken();
    }

    if (config.autoReconnect) {
      this._reconnectInterval = setInterval(() => this._checkWebsocket(), RECONNECT_INTERVAL_MS);
    }
  }

  destroy(): void {
    if (this._reconnectInterval) {
      clearInterval(this._reconnectInterval);
      this._reconnectInterval = null;
    }
    this.unsubscribe();
  }

  onMessage(callback: (message: CastMessage) => void): void {
    this._onMessageCallback = callback;
  }

  setHub(hubName: string): boolean {
    if (hubName === this._hub.name) {
      console.debug('CastClient: setHub: hub already set to', hubName);
      return true;
    }
    console.debug('CastClient: setting hub to', hubName);
    const hubs = this._config.hubs;
    if (!hubs) {
      console.debug('CastClient: hub not found in configuration', hubName);
      return false;
    }
    for (const hubConfig of hubs) {
      if (hubConfig.enabled && hubConfig.name === hubName) {
        if (this._hub.subscribed) {
          this.unsubscribe();
        }
        this._hub = { ...hubConfig, subscribed: false } as HubConfig;
        return true;
      }
    }
    console.debug('CastClient: hub not found in configuration', hubName);
    return false;
  }

  getHub(): HubConfig {
    return this._hub;
  }

  setTopic(topic: string): void {
    console.debug('CastClient: setting topic to', topic);
    this._hub.topic = topic;
  }

  async getToken(): Promise<boolean> {
    const hub = this._hub;
    try {
      const url = new URL(hub.token_endpoint);
      console.debug('CastClient: Getting token from:', url.origin + url.pathname);
    } catch {
      console.debug('CastClient: Getting token from hub');
    }

    const tokenFormData = new URLSearchParams();
    tokenFormData.append('grant_type', 'client_credentials');
    tokenFormData.append('client_id', hub.client_id ?? '');
    tokenFormData.append('client_secret', hub.client_secret ?? '');
    tokenFormData.append('client_product_name', this._config.productName ?? 'OHIF');

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenFormData,
    };

    try {
      const response = await fetch(hub.token_endpoint, requestOptions);
      if (response.status === 200) {
        const config = await response.json();
        if (config.access_token) {
          hub.token = config.access_token;
        }
        hub.subscriberName = config.subscriber_name;
        if (config.topic) {
          this.setTopic(config.topic);
          if (this._config.autoStart) {
            this.subscribe();
          }
        }
        return true;
      }
      await response.text(); // consume body (may contain sensitive data; do not log)
      console.error('CastClient: Error getting token. Status:', response.status);
      return false;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('CastClient: Exception getting token:', message);
      return false;
    }
  }

  async subscribe(): Promise<number | string> {
    const hub = this._hub;
    if (hub.topic === undefined) {
      console.warn('CastClient: Error. subscription not sent. No topic defined.');
      return 'error: topic not defined';
    }
    if (!hub.token) {
      console.warn('CastClient: Error. subscription not sent. No token available.');
      return 'error: no token';
    }

    const callbackUrl = this._config.callbackUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/castCallback` : '');
    const subscribeFormData = new URLSearchParams();
    subscribeFormData.append('hub.mode', 'subscribe');
    subscribeFormData.append('hub.channel.type', 'websocket');
    subscribeFormData.append('hub.callback', callbackUrl);
    subscribeFormData.append('hub.events', (hub.events ?? []).toString());
    subscribeFormData.append('hub.topic', hub.topic);
    subscribeFormData.append('hub.lease', String(hub.lease ?? 999));
    subscribeFormData.append('subscriber.name', hub.subscriberName ?? '');

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Bearer ' + hub.token,
      },
      body: subscribeFormData,
      signal: AbortSignal.timeout(SUBSCRIBE_TIMEOUT_MS),
    };

    try {
      const response = await fetch(hub.hub_endpoint, requestOptions);
      if (response.status === 202) {
        hub.subscribed = true;
        hub.resubscribeRequested = false;
        const subscriptionResponse = await response.json();
        const websocketUrl = subscriptionResponse['hub.channel.endpoint'];

        let normalizedWebsocketUrl = websocketUrl;
        try {
          const hubEndpointUrl = new URL(hub.hub_endpoint);
          const wsUrl = new URL(websocketUrl);
          const wsProtocol = hubEndpointUrl.protocol === 'https:' ? 'wss:' : 'ws:';
          normalizedWebsocketUrl = websocketUrl.replace(wsUrl.origin, `${wsProtocol}//${hubEndpointUrl.host}`);
        } catch {
          // use original
        }

        hub.websocket = new WebSocket(normalizedWebsocketUrl);
        hub.websocket.onopen = function () {
          (this as WebSocket).send('{"hub.channel.endpoint":"' + normalizedWebsocketUrl + '"}');
        };
        hub.websocket.addEventListener('message', (ev) => this._processEvent(ev.data));
        hub.websocket.addEventListener('close', () => this._websocketClose());
        hub.websocket.onerror = function () {
          console.warn('CastClient: Error reported on websocket');
        };

        return response.status;
      }
      if (response.status === 401) {
        console.warn('CastClient: Subscription response 401 - Token refresh needed.');
        this.getToken();
      } else {
        console.error('CastClient: Subscription rejected by hub. Status:', response.status);
      }
      return response.status;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('CastClient: Exception subscribing to the hub:', message);
      return 0;
    }
  }

  async unsubscribe(): Promise<void> {
    const hub = this._hub;
    hub.subscribed = false;
    hub.resubscribeRequested = false;

    const callbackUrl = this._config.callbackUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/castCallback` : '');
    const subscribeFormData = new URLSearchParams();
    subscribeFormData.append('hub.mode', 'unsubscribe');
    subscribeFormData.append('hub.channel.type', 'websocket');
    subscribeFormData.append('hub.callback', callbackUrl);
    subscribeFormData.append('hub.events', (hub.events ?? []).toString());
    subscribeFormData.append('hub.topic', hub.topic ?? '');
    subscribeFormData.append('hub.lease', String(hub.lease ?? 999));
    subscribeFormData.append('subscriber.name', hub.subscriberName ?? '');

    try {
      const response = await fetch(hub.hub_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Bearer ' + hub.token,
        },
        body: subscribeFormData,
        signal: AbortSignal.timeout(SUBSCRIBE_TIMEOUT_MS),
      });
      if (response.status === 202) {
        console.debug('CastClient: Unsubscribe successfully from hub', hub.name);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('CastClient: Error unsubscribing from the hub.', message);
    }
    if (hub.websocket) {
      hub.websocket.close();
      hub.websocket = null;
    }
  }

  async publish(castMessage: Record<string, unknown>, hub: HubConfig): Promise<Response | null> {
    const timestamp = new Date();
    const msg = { ...castMessage, timestamp: timestamp.toJSON() } as Record<string, unknown>;
    msg.id = generateMessageId('OHIF-');
    hub.lastPublishedMessageID = msg.id as string;

    const event = msg.event as Record<string, unknown>;
    if (event) {
      event['hub.topic'] = hub.topic;
    }

    let hubEndpoint = hub.hub_endpoint + '/' + hub.topic;
    if (hub.productName === 'PHILIPS') {
      hubEndpoint = hub.hub_endpoint;
    }

    try {
      const response = await fetch(hubEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + hub.token },
        body: JSON.stringify(msg),
      });
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.debug('CastClient:', message);
      return null;
    }
  }

  sendGetResponse(requestId: string, data: unknown, topic?: string): void {
    const hub = this._hub;
    if (!hub.websocket || hub.websocket.readyState !== WebSocket.OPEN) {
      return;
    }
    const response = {
      timestamp: new Date().toJSON(),
      id: generateMessageId('OHIF-'),
      event: {
        'hub.topic': topic ?? hub.topic,
        'hub.event': 'get-response',
        context: { requestId, data },
      },
    };
    hub.websocket.send(JSON.stringify(response));
  }

  private _createEmptyHub(): HubConfig {
    return {
      name: '',
      friendlyName: '',
      productName: '',
      enabled: false,
      events: [],
      lease: 999,
      hub_endpoint: '',
      authorization_endpoint: '',
      token_endpoint: '',
      token: '',
      subscriberName: '',
      topic: '',
      lastPublishedMessageID: '',
      subscribed: false,
      resubscribeRequested: false,
      websocket: null,
    };
  }

  private async _checkWebsocket(): Promise<void> {
    const hub = this._hub;
    if (hub.resubscribeRequested && hub.subscribed && this._config.autoReconnect) {
      console.debug('CastClient: Try to resubscribe');
      hub.resubscribeRequested = false;
      const response = await this.subscribe();
      if (response !== 202) {
        hub.resubscribeRequested = true;
      }
    } else if (!hub.subscribed && hub.resubscribeRequested) {
      hub.resubscribeRequested = false;
    }
  }

  private _processEvent(eventData: string): void {
    try {
      const castMessage = JSON.parse(eventData) as CastMessage;
      if (castMessage['hub.mode' as keyof CastMessage]) {
        return;
      }
      const event = castMessage.event;
      if (!event) return;
      if (event['hub.event'] === 'heartbeat') {
        return;
      }
      if (castMessage.id === this._hub.lastPublishedMessageID) {
        return;
      }
      this._onMessageCallback?.(castMessage);
    } catch (err) {
      console.warn('CastClient: websocket processing error:', err);
    }
  }

  private _websocketClose(): void {
    console.debug('CastClient: websocket is closed.');
    this._hub.resubscribeRequested = true;
  }
}
