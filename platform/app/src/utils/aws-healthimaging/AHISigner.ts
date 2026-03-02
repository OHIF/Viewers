import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';

export interface AHICredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration?: number;
}

export interface AHIConfig {
  region: string;
  datastoreId: string;
  credentials: AHICredentials;
  credentialRefreshCallback?: () => Promise<AHICredentials>;
  refreshBufferSeconds?: number;
  customEndpoint?: string; // e.g., 'https://dicom-medical-imaging.us-east-1.amazonaws.com'
}

class AHISigner {
  private signer: SignatureV4 | null = null;
  private credentials: AHICredentials | null = null;
  private config: AHIConfig | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private originalFetch: typeof fetch | null = null;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;
  private isInitialized = false;

  initialize(config: AHIConfig): void {
    this.config = config;
    this.credentials = config.credentials;
    this.buildSigner();
    this.setupFetchOverride();
    this.setupXHROverride();
    this.scheduleCredentialRefresh();
    this.isInitialized = true;

    console.log('[AHI] SigV4 signer initialized for datastore:', config.datastoreId);
    console.log('[AHI] Region:', config.region);
    console.log('[AHI] Custom endpoint:', config.customEndpoint || 'none');
    console.log('[AHI] Credentials present:', !!config.credentials.accessKeyId);
  }

  private buildSigner(): void {
    if (!this.config || !this.credentials) {
      throw new Error('[AHI] Cannot build signer without config and credentials');
    }

    this.signer = new SignatureV4({
      service: 'medical-imaging',
      region: this.config.region,
      credentials: {
        accessKeyId: this.credentials.accessKeyId,
        secretAccessKey: this.credentials.secretAccessKey,
        sessionToken: this.credentials.sessionToken,
      },
      sha256: Sha256,
    });
  }

  private setupFetchOverride(): void {
    if (this.originalFetch) {
      return;
    }

    this.originalFetch = window.fetch.bind(window);
    const self = this;

    console.log('[AHI] Setting up fetch override');

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlString = input instanceof Request ? input.url : input.toString();

      // Log ALL fetch requests for debugging
      console.log('[AHI] Fetch called:', urlString);

      let url: URL;
      try {
        url = new URL(urlString);
      } catch {
        return self.originalFetch!(input, init);
      }

      // Check for both standard and custom AHI hostnames
      const isAHIRequest = url.hostname.includes('medical-imaging') ||
        url.hostname.includes('dicom-medical-imaging');

      if (!isAHIRequest) {
        return self.originalFetch!(input, init);
      }

      console.log('[AHI] Intercepted AHI request:', url.toString());

      if (!self.signer) {
        console.error('[AHI] Signer not initialized');
        return self.originalFetch!(input, init);
      }

      try {
        const signedRequest = await self.signRequest(url, init);

        // Log signed headers for debugging
        console.log('[AHI] Signed headers:', JSON.stringify(signedRequest.headers, null, 2));

        // Verify authorization header exists
        if (!signedRequest.headers['authorization']) {
          console.error('[AHI] Missing authorization header in signed request!');
        }

        // Create new fetch with signed headers - use URL string, not input
        return self.originalFetch!(url.toString(), {
          method: signedRequest.method,
          headers: signedRequest.headers as HeadersInit,
          body: init?.body,
          mode: init?.mode,
          credentials: init?.credentials,
          cache: init?.cache,
          redirect: init?.redirect,
          referrer: init?.referrer,
          integrity: init?.integrity,
        });
      } catch (error) {
        console.error('[AHI] Failed to sign request:', error);
        throw error;
      }
    };
  }

  private setupXHROverride(): void {
    if (this.originalXHROpen) {
      return;
    }

    console.log('[AHI] Setting up XHR override');

    const self = this;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;

    // Store request info on the XHR object
    const xhrRequestInfo = new WeakMap<XMLHttpRequest, { method: string; url: string }>();

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ) {
      const urlString = url.toString();
      console.log('[AHI] XHR open called:', method, urlString);

      xhrRequestInfo.set(this, { method, url: urlString });
      return self.originalXHROpen!.call(this, method, url, async, username, password);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const requestInfo = xhrRequestInfo.get(this);

      if (!requestInfo) {
        return self.originalXHRSend!.call(this, body);
      }

      const { method, url: urlString } = requestInfo;

      let url: URL;
      try {
        url = new URL(urlString);
      } catch {
        return self.originalXHRSend!.call(this, body);
      }

      // Check for AHI hostnames
      const isAHIRequest = url.hostname.includes('medical-imaging') ||
        url.hostname.includes('dicom-medical-imaging');

      if (!isAHIRequest) {
        return self.originalXHRSend!.call(this, body);
      }

      console.log('[AHI] Intercepted XHR request:', urlString);

      if (!self.signer) {
        console.error('[AHI] Signer not initialized for XHR');
        return self.originalXHRSend!.call(this, body);
      }

      // Sign the request synchronously using a workaround
      const xhr = this;

      // We need to sign asynchronously but XHR.send is sync
      // Abort the current request and make a new signed one
      self.signRequestForXHR(url, method).then(signedHeaders => {
        console.log('[AHI] XHR signed headers:', Object.keys(signedHeaders));

        // Set the signed headers
        for (const [key, value] of Object.entries(signedHeaders)) {
          if (key.toLowerCase() !== 'host') {
            xhr.setRequestHeader(key, value);
          }
        }

        // Now send with original method
        self.originalXHRSend!.call(xhr, body);
      }).catch(error => {
        console.error('[AHI] Failed to sign XHR request:', error);
        self.originalXHRSend!.call(xhr, body);
      });
    };
  }

  private async signRequestForXHR(
    url: URL,
    method: string
  ): Promise<Record<string, string>> {
    if (!this.signer) {
      throw new Error('[AHI] Signer not initialized');
    }

    const headers: Record<string, string> = {
      host: url.hostname,
    };

    const request = new HttpRequest({
      protocol: url.protocol,
      method: method.toUpperCase(),
      hostname: url.hostname,
      port: url.port ? parseInt(url.port, 10) : undefined,
      path: url.pathname,
      query: this.parseQueryString(url.search),
      headers,
    });

    const signedRequest = await this.signer.sign(request) as HttpRequest;
    return signedRequest.headers as Record<string, string>;
  }

  private parseQueryString(search: string): Record<string, string> {
    const query: Record<string, string> = {};
    if (search.startsWith('?')) {
      search = search.slice(1);
    }
    if (!search) {
      return query;
    }
    for (const pair of search.split('&')) {
      const [key, value] = pair.split('=');
      if (key) {
        query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    }
    return query;
  }

  private async signRequest(
    url: URL,
    init?: RequestInit
  ): Promise<HttpRequest> {
    if (!this.signer) {
      throw new Error('[AHI] Signer not initialized');
    }

    const headers: Record<string, string> = {
      host: url.hostname,
    };

    if (init?.headers) {
      const headerEntries = init.headers instanceof Headers
        ? Array.from(init.headers.entries())
        : Object.entries(init.headers as Record<string, unknown>);

      for (const [key, value] of headerEntries) {
        // Ensure value is a string (could be array in some cases)
        const stringValue = Array.isArray(value) ? value.join(', ') : String(value);
        headers[key.toLowerCase()] = stringValue;
      }
    }

    const request = new HttpRequest({
      protocol: url.protocol,
      method: (init?.method || 'GET').toUpperCase(),
      hostname: url.hostname,
      port: url.port ? parseInt(url.port, 10) : undefined,
      path: url.pathname,
      query: this.parseQueryString(url.search),
      headers,
    });

    return this.signer.sign(request) as Promise<HttpRequest>;
  }

  private scheduleCredentialRefresh(): void {
    if (!this.config?.credentialRefreshCallback || !this.credentials?.expiration) {
      return;
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const bufferSeconds = this.config.refreshBufferSeconds ?? 10;
    const now = Date.now();
    const expirationTime = this.credentials.expiration * 1000;
    const refreshTime = expirationTime - now - bufferSeconds * 1000;

    if (refreshTime <= 0) {
      this.refreshCredentials();
      return;
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshCredentials();
    }, refreshTime);

    console.log(`[AHI] Credential refresh scheduled in ${Math.round(refreshTime / 1000)}s`);
  }

  private async refreshCredentials(): Promise<void> {
    if (!this.config?.credentialRefreshCallback) {
      console.warn('[AHI] No credential refresh callback configured');
      return;
    }

    try {
      console.log('[AHI] Refreshing credentials...');
      const newCredentials = await this.config.credentialRefreshCallback();
      this.updateCredentials(newCredentials);
      console.log('[AHI] Credentials refreshed successfully');
    } catch (error) {
      console.error('[AHI] Failed to refresh credentials:', error);
      setTimeout(() => this.refreshCredentials(), 5000);
    }
  }

  updateCredentials(credentials: AHICredentials): void {
    this.credentials = credentials;
    this.buildSigner();
    this.scheduleCredentialRefresh();
  }

  getDatastoreId(): string | null {
    return this.config?.datastoreId ?? null;
  }

  getRegion(): string | null {
    return this.config?.region ?? null;
  }

  getEndpointUrl(): string | null {
    if (!this.config) {
      return null;
    }
    if (this.config.customEndpoint) {
      return `${this.config.customEndpoint}/datastore/${this.config.datastoreId}`;
    }
    return `https://medical-imaging.${this.config.region}.amazonaws.com/datastore/${this.config.datastoreId}`;
  }

  getCustomEndpoint(): string | null {
    return this.config?.customEndpoint ?? null;
  }

  isReady(): boolean {
    return this.isInitialized && this.signer !== null;
  }

  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
      this.originalXHROpen = null;
    }

    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
      this.originalXHRSend = null;
    }

    this.signer = null;
    this.credentials = null;
    this.config = null;
    this.isInitialized = false;

    console.log('[AHI] Signer destroyed');
  }
}

export const ahiSigner = new AHISigner();
export default ahiSigner;
