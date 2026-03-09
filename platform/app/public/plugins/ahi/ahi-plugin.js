/**
 * AWS HealthImaging (AHI) Plugin for OHIF Viewer
 *
 * This plugin provides SigV4 signing for AWS HealthImaging requests.
 * It can be loaded dynamically via configuration without modifying OHIF source code.
 *
 * Configuration (in window.config):
 * {
 *   ahi: {
 *     enabled: true,
 *     pluginUrl: '/plugins/ahi/ahi-plugin.js',
 *     defaultRegion: 'us-east-1',
 *     refreshBufferSeconds: 10,
 *     customEndpoint: 'https://dicom-medical-imaging.us-east-1.amazonaws.com',
 *     backendUrl: 'https://your-backend.example.com',
 *   }
 * }
 *
 * URL Parameters:
 * - region: AWS region
 * - datastoreId: AHI datastore ID
 * - accessKeyId, secretAccessKey, sessionToken: Direct credentials
 * - backendUrl, orgId, studyUid: Backend credential fetch mode
 */

(function (global) {
  'use strict';

  // AWS SDK dependencies - loaded dynamically
  let SignatureV4, HttpRequest, Sha256;

  /**
   * AHI Credentials interface
   */
  class AHICredentials {
    constructor({ accessKeyId, secretAccessKey, sessionToken, expiration }) {
      this.accessKeyId = accessKeyId;
      this.secretAccessKey = secretAccessKey;
      this.sessionToken = sessionToken;
      this.expiration = expiration;
    }
  }

  /**
   * AHI Signer - handles SigV4 signing for AWS HealthImaging requests
   */
  class AHISigner {
    constructor() {
      this.signer = null;
      this.credentials = null;
      this.config = null;
      this.refreshTimer = null;
      this.originalFetch = null;
      this.originalXHROpen = null;
      this.originalXHRSend = null;
      this.isInitialized = false;
    }

    async initialize(config) {
      // Load AWS SDK dependencies
      await this._loadDependencies();

      this.config = config;
      this.credentials = config.credentials;
      this._buildSigner();
      this._setupFetchOverride();
      this._setupXHROverride();
      this._scheduleCredentialRefresh();
      this.isInitialized = true;

      console.log('[AHI Plugin] SigV4 signer initialized for datastore:', config.datastoreId);
      console.log('[AHI Plugin] Region:', config.region);
      console.log('[AHI Plugin] Custom endpoint:', config.customEndpoint || 'none');
    }

    async _loadDependencies() {
      if (SignatureV4) return; // Already loaded

      console.log('[AHI Plugin] Loading AWS SDK dependencies...');

      // Load dependencies via script tags (more reliable than dynamic import)
      const loadScript = (url) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = url;
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Failed to load: ${url}`));
          document.head.appendChild(script);
        });
      };

      try {
        // Load AWS SDK bundle from unpkg (UMD format, sets window globals)
        await loadScript('https://unpkg.com/@aws-sdk/signature-v4@3.370.0/dist-cjs/index.js');
        await loadScript('https://unpkg.com/@aws-sdk/protocol-http@3.370.0/dist-cjs/index.js');
        await loadScript('https://unpkg.com/@aws-crypto/sha256-js@5.0.0/dist-cjs/index.js');

        // Try to get from window globals or require
        if (typeof window.AWS_SDK_SIGNATURE_V4 !== 'undefined') {
          SignatureV4 = window.AWS_SDK_SIGNATURE_V4.SignatureV4;
          HttpRequest = window.AWS_SDK_PROTOCOL_HTTP.HttpRequest;
          Sha256 = window.AWS_CRYPTO_SHA256_JS.Sha256;
        } else {
          // Fallback: use inline implementation
          console.log('[AHI Plugin] Using inline SigV4 implementation');
          await this._useInlineSigV4();
        }

        console.log('[AHI Plugin] AWS SDK dependencies loaded');
      } catch (e) {
        console.warn('[AHI Plugin] CDN load failed, using inline implementation:', e.message);
        await this._useInlineSigV4();
      }
    }

    async _useInlineSigV4() {
      // Minimal inline implementation of AWS SigV4 signing
      // This avoids external dependencies entirely

      Sha256 = class {
        constructor(secret) {
          this.secret = secret;
          this.data = [];
        }

        update(data) {
          if (typeof data === 'string') {
            this.data.push(new TextEncoder().encode(data));
          } else {
            this.data.push(data);
          }
          return this;
        }

        async digest() {
          const combined = new Uint8Array(this.data.reduce((acc, arr) => acc + arr.length, 0));
          let offset = 0;
          for (const arr of this.data) {
            combined.set(arr, offset);
            offset += arr.length;
          }

          if (this.secret) {
            const key = await crypto.subtle.importKey(
              'raw',
              typeof this.secret === 'string' ? new TextEncoder().encode(this.secret) : this.secret,
              { name: 'HMAC', hash: 'SHA-256' },
              false,
              ['sign']
            );
            const signature = await crypto.subtle.sign('HMAC', key, combined);
            return new Uint8Array(signature);
          } else {
            const hash = await crypto.subtle.digest('SHA-256', combined);
            return new Uint8Array(hash);
          }
        }
      };

      HttpRequest = class {
        constructor(options) {
          this.method = options.method || 'GET';
          this.protocol = options.protocol || 'https:';
          this.hostname = options.hostname;
          this.port = options.port;
          this.path = options.path || '/';
          this.query = options.query || {};
          this.headers = options.headers || {};
          this.body = options.body;
        }

        clone() {
          return new HttpRequest({
            method: this.method,
            protocol: this.protocol,
            hostname: this.hostname,
            port: this.port,
            path: this.path,
            query: { ...this.query },
            headers: { ...this.headers },
            body: this.body,
          });
        }
      };

      SignatureV4 = class {
        constructor(options) {
          this.service = options.service;
          this.region = options.region;
          this.credentials = options.credentials;
          this.sha256 = options.sha256 || Sha256;
        }

        async sign(request, options = {}) {
          const signingDate = options.signingDate || new Date();
          const signedRequest = request.clone ? request.clone() : { ...request, headers: { ...request.headers } };

          const dateStamp = signingDate.toISOString().slice(0, 10).replace(/-/g, '');
          const amzDate = signingDate.toISOString().replace(/[:-]|\.\d{3}/g, '');

          signedRequest.headers['x-amz-date'] = amzDate;

          if (this.credentials.sessionToken) {
            signedRequest.headers['x-amz-security-token'] = this.credentials.sessionToken;
          }

          // Create canonical request
          const method = signedRequest.method;
          const canonicalUri = signedRequest.path || '/';
          const canonicalQueryString = this._getCanonicalQueryString(signedRequest.query || {});

          const signedHeaders = Object.keys(signedRequest.headers)
            .map(k => k.toLowerCase())
            .sort()
            .join(';');

          const canonicalHeaders = Object.keys(signedRequest.headers)
            .map(k => `${k.toLowerCase()}:${signedRequest.headers[k].trim()}`)
            .sort()
            .join('\n') + '\n';

          const payloadHash = await this._hashPayload(signedRequest.body);
          signedRequest.headers['x-amz-content-sha256'] = payloadHash;

          const canonicalRequest = [
            method,
            canonicalUri,
            canonicalQueryString,
            canonicalHeaders,
            signedHeaders,
            payloadHash,
          ].join('\n');

          // Create string to sign
          const credentialScope = `${dateStamp}/${this.region}/${this.service}/aws4_request`;
          const hashedCanonicalRequest = await this._hash(canonicalRequest);
          const stringToSign = [
            'AWS4-HMAC-SHA256',
            amzDate,
            credentialScope,
            hashedCanonicalRequest,
          ].join('\n');

          // Calculate signature
          const signingKey = await this._getSignatureKey(dateStamp);
          const signature = await this._hmac(signingKey, stringToSign);
          const signatureHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

          // Build authorization header
          const authorization = `AWS4-HMAC-SHA256 Credential=${this.credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;
          signedRequest.headers['Authorization'] = authorization;

          return signedRequest;
        }

        _getCanonicalQueryString(query) {
          return Object.keys(query)
            .sort()
            .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
            .join('&');
        }

        async _hash(data) {
          const hash = new this.sha256();
          hash.update(data);
          const digest = await hash.digest();
          return Array.from(digest).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async _hashPayload(body) {
          if (!body) return await this._hash('');
          if (typeof body === 'string') return await this._hash(body);
          return await this._hash('');
        }

        async _hmac(key, data) {
          const hash = new this.sha256(key);
          hash.update(data);
          return await hash.digest();
        }

        async _getSignatureKey(dateStamp) {
          const kDate = await this._hmac(new TextEncoder().encode('AWS4' + this.credentials.secretAccessKey), dateStamp);
          const kRegion = await this._hmac(kDate, this.region);
          const kService = await this._hmac(kRegion, this.service);
          const kSigning = await this._hmac(kService, 'aws4_request');
          return kSigning;
        }
      };

      console.log('[AHI Plugin] Inline SigV4 implementation ready');
    }

    _buildSigner() {
      if (!this.config || !this.credentials) {
        throw new Error('[AHI Plugin] Cannot build signer without config and credentials');
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

    _setupFetchOverride() {
      if (this.originalFetch) return;

      this.originalFetch = window.fetch.bind(window);
      const self = this;

      console.log('[AHI Plugin] Setting up fetch override');

      window.fetch = async (input, init) => {
        const urlString = input instanceof Request ? input.url : input.toString();

        let url;
        try {
          url = new URL(urlString);
        } catch {
          return self.originalFetch(input, init);
        }

        // Check for AHI hostnames
        const isAHIRequest = url.hostname.includes('medical-imaging') ||
          url.hostname.includes('dicom-medical-imaging');

        if (!isAHIRequest) {
          return self.originalFetch(input, init);
        }

        console.log('[AHI Plugin] Intercepted AHI request:', url.toString());

        if (!self.signer) {
          console.error('[AHI Plugin] Signer not initialized');
          return self.originalFetch(input, init);
        }

        try {
          const signedRequest = await self._signRequest(url, init);

          return self.originalFetch(url.toString(), {
            method: signedRequest.method,
            headers: signedRequest.headers,
            body: init?.body,
            mode: init?.mode,
            credentials: init?.credentials,
            cache: init?.cache,
            redirect: init?.redirect,
            referrer: init?.referrer,
            integrity: init?.integrity,
          });
        } catch (error) {
          console.error('[AHI Plugin] Failed to sign request:', error);
          throw error;
        }
      };
    }

    _setupXHROverride() {
      if (this.originalXHROpen) return;

      console.log('[AHI Plugin] Setting up XHR override');

      const self = this;
      this.originalXHROpen = XMLHttpRequest.prototype.open;
      this.originalXHRSend = XMLHttpRequest.prototype.send;

      const xhrRequestInfo = new WeakMap();

      XMLHttpRequest.prototype.open = function (method, url, async = true, username, password) {
        const urlString = url.toString();
        xhrRequestInfo.set(this, { method, url: urlString });
        return self.originalXHROpen.call(this, method, url, async, username, password);
      };

      XMLHttpRequest.prototype.send = function (body) {
        const requestInfo = xhrRequestInfo.get(this);

        if (!requestInfo) {
          return self.originalXHRSend.call(this, body);
        }

        const { method, url: urlString } = requestInfo;

        let url;
        try {
          url = new URL(urlString);
        } catch {
          return self.originalXHRSend.call(this, body);
        }

        const isAHIRequest = url.hostname.includes('medical-imaging') ||
          url.hostname.includes('dicom-medical-imaging');

        if (!isAHIRequest) {
          return self.originalXHRSend.call(this, body);
        }

        console.log('[AHI Plugin] Intercepted XHR request:', urlString);

        if (!self.signer) {
          console.error('[AHI Plugin] Signer not initialized for XHR');
          return self.originalXHRSend.call(this, body);
        }

        const xhr = this;

        self._signRequestForXHR(url, method).then(signedHeaders => {
          for (const [key, value] of Object.entries(signedHeaders)) {
            if (key.toLowerCase() !== 'host') {
              xhr.setRequestHeader(key, value);
            }
          }
          self.originalXHRSend.call(xhr, body);
        }).catch(error => {
          console.error('[AHI Plugin] Failed to sign XHR request:', error);
          self.originalXHRSend.call(xhr, body);
        });
      };
    }

    async _signRequestForXHR(url, method) {
      if (!this.signer) {
        throw new Error('[AHI Plugin] Signer not initialized');
      }

      const headers = { host: url.hostname };

      const request = new HttpRequest({
        protocol: url.protocol,
        method: method.toUpperCase(),
        hostname: url.hostname,
        port: url.port ? parseInt(url.port, 10) : undefined,
        path: url.pathname,
        query: this._parseQueryString(url.search),
        headers,
      });

      const signedRequest = await this.signer.sign(request);
      return signedRequest.headers;
    }

    _parseQueryString(search) {
      const query = {};
      if (search.startsWith('?')) {
        search = search.slice(1);
      }
      if (!search) return query;

      for (const pair of search.split('&')) {
        const [key, value] = pair.split('=');
        if (key) {
          query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
        }
      }
      return query;
    }

    async _signRequest(url, init) {
      if (!this.signer) {
        throw new Error('[AHI Plugin] Signer not initialized');
      }

      const headers = { host: url.hostname };

      if (init?.headers) {
        const headerEntries = init.headers instanceof Headers
          ? Array.from(init.headers.entries())
          : Object.entries(init.headers);

        for (const [key, value] of headerEntries) {
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
        query: this._parseQueryString(url.search),
        headers,
      });

      return this.signer.sign(request);
    }

    _scheduleCredentialRefresh() {
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
        this._refreshCredentials();
        return;
      }

      this.refreshTimer = setTimeout(() => {
        this._refreshCredentials();
      }, refreshTime);

      console.log(`[AHI Plugin] Credential refresh scheduled in ${Math.round(refreshTime / 1000)}s`);
    }

    async _refreshCredentials() {
      if (!this.config?.credentialRefreshCallback) {
        console.warn('[AHI Plugin] No credential refresh callback configured');
        return;
      }

      try {
        console.log('[AHI Plugin] Refreshing credentials...');
        const newCredentials = await this.config.credentialRefreshCallback();
        this.updateCredentials(newCredentials);
        console.log('[AHI Plugin] Credentials refreshed successfully');
      } catch (error) {
        console.error('[AHI Plugin] Failed to refresh credentials:', error);
        setTimeout(() => this._refreshCredentials(), 5000);
      }
    }

    updateCredentials(credentials) {
      this.credentials = credentials;
      this._buildSigner();
      this._scheduleCredentialRefresh();
    }

    getDatastoreId() {
      return this.config?.datastoreId ?? null;
    }

    getRegion() {
      return this.config?.region ?? null;
    }

    getEndpointUrl() {
      if (!this.config) return null;
      if (this.config.customEndpoint) {
        return `${this.config.customEndpoint}/datastore/${this.config.datastoreId}`;
      }
      return `https://medical-imaging.${this.config.region}.amazonaws.com/datastore/${this.config.datastoreId}`;
    }

    isReady() {
      return this.isInitialized && this.signer !== null;
    }

    destroy() {
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

      console.log('[AHI Plugin] Signer destroyed');
    }
  }

  // Singleton instance
  const ahiSigner = new AHISigner();

  /**
   * Initialize AHI from URL parameters and config
   */
  async function initializeFromUrlParams(config) {
    const urlParams = new URLSearchParams(window.location.search);

    const region = urlParams.get('region') || config?.ahi?.defaultRegion || 'us-east-1';
    const datastoreId = urlParams.get('datastoreId');

    // AHI endpoint (for medical imaging API requests) - does NOT default to window.location.origin
    const customEndpoint = urlParams.get('customEndpoint') || config?.ahi?.customEndpoint || undefined;

    // URL decode credentials
    const accessKeyId = urlParams.get('accessKeyId')?.replace(/ /g, '+');
    const secretAccessKey = urlParams.get('secretAccessKey')?.replace(/ /g, '+');
    const sessionToken = urlParams.get('sessionToken')?.replace(/ /g, '+');
    const expiration = urlParams.get('expiration');

    // Backend URL (for credential fetch only) - defaults to window.location.origin
    const backendUrl = urlParams.get('backendUrl') || config?.ahi?.backendUrl || window.location.origin;
    const orgId = urlParams.get('orgId') || config?.ahi?.orgId;
    const studyUid = urlParams.get('studyUid') || urlParams.get('StudyInstanceUIDs');

    console.log('[AHI Plugin] Config - backendUrl (credential fetch):', backendUrl);
    console.log('[AHI Plugin] Config - customEndpoint (AHI API):', customEndpoint || 'using default AWS endpoint');

    // Mode 1: Direct credentials in URL
    if (datastoreId && accessKeyId && secretAccessKey && sessionToken) {
      console.log('[AHI Plugin] Initializing with direct credentials');
      return await initializeWithDirectCredentials({
        region,
        datastoreId,
        accessKeyId,
        secretAccessKey,
        sessionToken,
        expiration: expiration ? parseInt(expiration, 10) : undefined,
        refreshBufferSeconds: config?.ahi?.refreshBufferSeconds ?? 10,
        config,
        customEndpoint,
      });
    }

    // Mode 2: Fetch credentials from backend
    if (backendUrl && orgId && studyUid) {
      console.log('[AHI Plugin] Initializing from backend');
      return await initializeFromBackend({
        backendUrl,
        orgId,
        studyUid,
        region,
        refreshBufferSeconds: config?.ahi?.refreshBufferSeconds ?? 10,
        config,
        customEndpoint,
      });
    }

    console.log('[AHI Plugin] No AHI credentials found - skipping initialization');
    return false;
  }

  async function initializeWithDirectCredentials(params) {
    const {
      region,
      datastoreId,
      accessKeyId,
      secretAccessKey,
      sessionToken,
      expiration,
      refreshBufferSeconds,
      config,
      customEndpoint,
    } = params;

    const credentials = new AHICredentials({
      accessKeyId,
      secretAccessKey,
      sessionToken,
      expiration,
    });

    await ahiSigner.initialize({
      region,
      datastoreId,
      credentials,
      refreshBufferSeconds,
      customEndpoint,
    });

    updateDataSourceUrls(config, region, datastoreId, customEndpoint);

    console.log('[AHI Plugin] Initialized with direct credentials');
    console.log('[AHI Plugin] Datastore:', datastoreId);
    console.log('[AHI Plugin] Region:', region);

    return true;
  }

  async function initializeFromBackend(params) {
    const { backendUrl, orgId, studyUid, region, refreshBufferSeconds, config, customEndpoint } = params;

    // Get token from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    try {
      const credentialUrl = `${backendUrl}/auth/credentials/${orgId}`;
      console.log('[AHI Plugin] Fetching credentials from:', credentialUrl);

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(credentialUrl, {
        method: 'GET',
        headers,
      });

      console.log('[AHI Plugin] Credential response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch AHI credentials: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const credentialResponse = await response.json();
      console.log('[AHI Plugin] Credential response received:', {
        hasRegion: !!credentialResponse.region,
        hasDatastoreId: !!credentialResponse.dataStoreId,
        hasCreds: !!credentialResponse.creds,
        hasEndPoint: !!credentialResponse.endPoint,
      });

      const { creds, region: responseRegion, dataStoreId, endPoint } = credentialResponse;
      const { accessKeyId, secretAccessKey, sessionToken, expiration } = creds || {};

      // dataStoreId is an array, use the first one
      const datastoreId = Array.isArray(dataStoreId) ? dataStoreId[0] : dataStoreId;

      if (!datastoreId || !accessKeyId || !secretAccessKey || !sessionToken) {
        throw new Error('Invalid credential response: missing required fields');
      }

      // Use endPoint from response as customEndpoint if available
      const effectiveCustomEndpoint = endPoint || customEndpoint;

      console.log('[AHI Plugin] Creating credentials object...');
      const effectiveRegion = responseRegion || region;

      // Parse expiration - convert ISO date string to Unix timestamp if needed
      let expirationTimestamp = expiration;
      if (typeof expiration === 'string') {
        expirationTimestamp = Math.floor(new Date(expiration).getTime() / 1000);
      }

      const credentials = new AHICredentials({
        accessKeyId,
        secretAccessKey,
        sessionToken,
        expiration: expirationTimestamp,
      });
      console.log('[AHI Plugin] Credentials object created');

      const credentialRefreshCallback = async () => {
        const refreshHeaders = {};
        if (token) {
          refreshHeaders['Authorization'] = `Bearer ${token}`;
        }

        const refreshResponse = await fetch(`${backendUrl}/auth/credentials/${orgId}`, {
          method: 'GET',
          headers: refreshHeaders,
        });

        if (!refreshResponse.ok) {
          throw new Error(`Failed to refresh AHI credentials: ${refreshResponse.statusText}`);
        }

        const refreshData = await refreshResponse.json();
        const refreshCreds = refreshData.creds || {};

        // Parse expiration for refresh
        let refreshExpiration = refreshCreds.expiration;
        if (typeof refreshExpiration === 'string') {
          refreshExpiration = Math.floor(new Date(refreshExpiration).getTime() / 1000);
        }

        return new AHICredentials({
          accessKeyId: refreshCreds.accessKeyId,
          secretAccessKey: refreshCreds.secretAccessKey,
          sessionToken: refreshCreds.sessionToken,
          expiration: refreshExpiration,
        });
      };

      console.log('[AHI Plugin] Initializing signer...');
      try {
        await ahiSigner.initialize({
          region: effectiveRegion,
          datastoreId,
          credentials,
          credentialRefreshCallback,
          refreshBufferSeconds,
          customEndpoint: effectiveCustomEndpoint,
        });
        console.log('[AHI Plugin] Signer initialized successfully');
      } catch (signerError) {
        console.error('[AHI Plugin] Signer initialization failed:', signerError);
        throw signerError;
      }

      console.log('[AHI Plugin] Updating data source URLs...');
      updateDataSourceUrls(config, effectiveRegion, datastoreId, effectiveCustomEndpoint);

      console.log('[AHI Plugin] Initialized from backend');
      console.log('[AHI Plugin] Datastore:', datastoreId);
      console.log('[AHI Plugin] Region:', effectiveRegion);

      return true;
    } catch (error) {
      console.error('[AHI Plugin] Failed to initialize from backend:', error);
      console.error('[AHI Plugin] Error stack:', error.stack);
      return false;
    }
  }

  function updateDataSourceUrls(config, region, datastoreId, customEndpoint) {
    const baseUrl = customEndpoint
      ? `${customEndpoint}/datastore/${datastoreId}`
      : `https://medical-imaging.${region}.amazonaws.com/datastore/${datastoreId}`;

    const ahiDataSource = config?.dataSources?.find(ds => ds.sourceName === 'ahi');

    if (ahiDataSource) {
      ahiDataSource.configuration.qidoRoot = baseUrl;
      ahiDataSource.configuration.wadoRoot = baseUrl;
      ahiDataSource.configuration.wadoUriRoot = baseUrl;
      console.log('[AHI Plugin] Updated data source URLs:', baseUrl);
    }
  }

  // Export plugin API
  const AHIPlugin = {
    name: 'ahi',
    version: '1.0.0',
    signer: ahiSigner,
    initialize: initializeFromUrlParams,
    initializeWithCredentials: initializeWithDirectCredentials,
    initializeFromBackend: initializeFromBackend,
    updateDataSourceUrls: updateDataSourceUrls,
    AHICredentials: AHICredentials,
    AHISigner: AHISigner,
  };

  // Register globally
  global.AHIPlugin = AHIPlugin;

  // Also support module exports if available
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AHIPlugin;
  }

})(typeof window !== 'undefined' ? window : this);
