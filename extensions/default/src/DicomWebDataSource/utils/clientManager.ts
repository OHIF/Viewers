import { api } from 'dicomweb-client';
import { errorHandler, utils } from '@ohif/core';

import StaticWadoClient from './StaticWadoClient';
import getClientRejectFunction from './getClientRejectFunction';

interface DICOMWebConfig {
  url: string;
  qidoRoot: string;
  wadoRoot: string;
  wadoUriRoot: string;
  staticWado: boolean;
  singlepart: boolean;
  name: string;
  supportsReject: boolean;
  qidoConfig: {
    url: string;
    staticWado: boolean;
    singlepart: boolean;
    headers: object;
  };
  wadoConfig: {
    url: string;
    staticWado: boolean;
    singlepart: boolean;
    headers: object;
  };
  qidoDicomWebClient: api.DICOMwebClient | StaticWadoClient;
  wadoDicomWebClient: api.DICOMwebClient | StaticWadoClient;
}

/**
 * Manages DICOMweb clients and their configurations.
 */
export default class DicomWebClientManager {
  private clients;
  userAuthenticationService;

  /**
   * Creates a new instance of DicomWebClientManager.
   * @param params - Key/value pairs of URL parameters.
   * @param query - URLSearchParams object generated for the URL.
   * @param dicomWebConfigs - DICOMweb server configurations.
   * @param userAuthenticationService - User authentication service.
   */
  constructor({ params, query, dicomWebConfigs, userAuthenticationService }) {
    this.clients = [];
    this.userAuthenticationService = userAuthenticationService;
    if (!dicomWebConfigs) {
      return;
    }
    const configArray = Array.isArray(dicomWebConfigs) ? dicomWebConfigs : [dicomWebConfigs];
    configArray.forEach(config => this.addConfiguration(params, query, config));
  }

  /**
   * Sets authorization headers for all clients before queries.
   * @returns {void}
   */
  public setQidoHeaders(): void {
    this.clients.forEach(
      client => (client.qidoDicomWebClient.headers = this.getAuthorizationHeaders())
    );
  }

  /**
   * Sets wado headers for all clients before queries.
   * @returns {void}
   */
  public setWadoHeaders(): void {
    this.clients.forEach(
      client => (client.wadoDicomWebClient.headers = this.getWadoHeader(client))
    );
  }

  /**
   * Sets authorization headers for wado clients before queries.
   * @returns {void}
   */
  public setAuthorizationHeadersForWADO(): void {
    this.clients.forEach(
      client => (client.wadoDicomWebClient.headers = this.getAuthorizationHeaders())
    );
  }

  /**
   * Returns a boolean indicating if a client has reject abilities.
   * @param name - The name of the client.
   * @returns {boolean} - Client reject support.
   */
  public clientCanReject(name) {
    return this.getClient(name)?.supportsReject;
  }

  /**
   * Returns the reject function of a client.
   * @param name - The name of the client.
   * @returns {object} - Client reject object.
   */
  public getClientRejectObject(name) {
    const client = this.getClient(name);
    if (client?.supportsReject) {
      return getClientRejectFunction(client);
    }
  }

  /**
   * Returns the qido client.
   * @param name - The name of the client.
   * @returns {object} - QIDO client.
   */
  public getQidoClient(name?: string): object {
    this.setQidoHeaders();
    const client = this.getClient(name);
    return client?.qidoDicomWebClient;
  }

  /**
   * Returns the wado client.
   * @param name - The name of the client.
   * @returns {object} - WADO client.
   */
  public getWadoClient(name?: string): object {
    this.setAuthorizationHeadersForWADO();
    const client = this.getClient(name);
    return client?.wadoDicomWebClient;
  }

  /**
   * Returns the client configuration.
   * @param name - The name of the client.
   * @returns {object} - Client configuration.
   */
  public getConfig(name?: string): object {
    return name ? this.clients.find(client => client.name === name) : this.clients[0];
  }

  /**
   * Gets the client list already setting the necessary wado headers.
   * @returns {Array} - Client list.
   */
  public getWadoClients() {
    this.setWadoHeaders();
    return this.getClients();
  }

  /**
   * Gets the client list already setting the necessary qido headers.
   * @returns {Array} - Client list.
   */
  public getQidoClients() {
    this.setQidoHeaders();
    return this.getClients();
  }

  /**
   * Returns the client list.
   * @returns {Array} - Client list.
   */
  public getClients() {
    return this.clients;
  }

  /**
   * Adds a client to client list given a DICOMweb server configuration.
   * @param dicomWebConfig - DICOMweb server configuration.
   * @returns {void}
   */
  private addClient(dicomWebConfig: DICOMWebConfig): void {
    /**
     * if no qidoRoot or wadoRoot, don't add the client. Could be the case for
     * configurations that relies on onConfiguration function but lacks necessary
     * additional information.
     */
    if (!dicomWebConfig?.qidoRoot || !dicomWebConfig?.wadoRoot) {
      return;
    }
    const config = Object.assign({}, dicomWebConfig);

    const { qidoRoot, wadoRoot, staticWado, singlepart, name, ...otherConfigs } = config;

    const commonConfig = {
      staticWado,
      singlepart,
      headers: this.userAuthenticationService.getAuthorizationHeader(),
      errorInterceptor: errorHandler.getHTTPErrorHandler(),
      ...otherConfigs,
    };

    config.qidoConfig = { url: qidoRoot, ...commonConfig };
    config.wadoConfig = { url: wadoRoot, ...commonConfig };

    const createClient = clientConfig =>
      staticWado ? new StaticWadoClient(clientConfig) : new api.DICOMwebClient(clientConfig);

    config.qidoDicomWebClient = createClient(config.qidoConfig);
    config.wadoDicomWebClient = createClient(config.wadoConfig);

    config.qidoDicomWebClient.name = name;
    config.wadoDicomWebClient.name = name;
    this.clients.push(config);
  }

  /**
   * Process a DICOMweb server configuration and add it to the clients list.
   * If onConfiguration function is specified, it calls it first to change the
   * configuration, if defined.
   * @param params - Key/value pairs of URL parameters.
   * @param query - URLSearchParams object generated for the URL.
   * @param config - Client configuration.
   * @returns {void}
   */
  private addConfiguration(params, query, config): void {
    if (config.onConfiguration && typeof config.onConfiguration === 'function') {
      config = config.onConfiguration(config, {
        params,
        query,
      });
    }
    this.addClient(config);
  }

  /**
   * Get authorization headers for wado and qido calls.
   * @returns {object} - XHR request headers.
   */
  private getAuthorizationHeaders(): object {
    const xhrRequestHeaders = {};
    if (this.userAuthenticationService?.getAuthorizationHeaders) {
      const authHeaders = this.userAuthenticationService.getAuthorizationHeaders();
      if (authHeaders?.Authorization) {
        xhrRequestHeaders.Authorization = authHeaders.Authorization;
      }
    }
    return xhrRequestHeaders;
  }

  /**
   * Generates the header for wado messages for a specific client.
   * @param config - Client configuration.
   * @returns {object} - WADO headers.
   */
  private getWadoHeader(config): object {
    const authorizationHeader = this.getAuthorizationHeaders();
    //Generate accept header depending on config params
    const formattedAcceptHeader = utils.generateAcceptHeader(
      config.acceptHeader,
      config.requestTransferSyntaxUID,
      config.omitQuotationForMultipartRequest
    );

    return {
      ...authorizationHeader,
      Accept: formattedAcceptHeader,
    };
  }

  /**
   * Returns the client configuration.
   * @param name - The name of the client.
   * @returns {DICOMWebConfig} - Client configuration.
   */
  private getClient(name?: string): DICOMWebConfig {
    return name ? this.clients.find(client => client.name === name) : this.clients[0];
  }
}
