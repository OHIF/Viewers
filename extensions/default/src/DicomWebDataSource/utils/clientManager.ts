import { api } from 'dicomweb-client';
import StaticWadoClient from './StaticWadoClient';
import dcm4cheeReject from '../dcm4cheeReject';
import { errorHandler, utils } from '@ohif/core';

/**
 * This object plays the central role in OHIF's multiple server handling ability.
 * It stores all servers configurations and handles all request headers generations
 */
interface ConfigToAdd {
  url: string;
  qidoRoot: string;
  wadoRoot: string;
  staticWado: boolean;
  singlepart: boolean;
  name: string;
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
export default class ClientManager {
  clients;
  userAuthenticationService;

  constructor({ params, query, dicomWebConfig, userAuthenticationService }) {
    this.clients = [];
    this.userAuthenticationService = userAuthenticationService;
    const configArray = Array.isArray(dicomWebConfig) ? dicomWebConfig : [dicomWebConfig];
    configArray.forEach(config => this.addConfiguration(params, query, config));
  }

  /**
   * Sets authorization headers for all clients before queries
   * @returns {void}
   */
  public setQidoHeaders(): void {
    this.clients.forEach(
      client => (client.qidoDicomWebClient.headers = this.getAuthorizationHeader())
    );
  }

  /**
   * Sets wado headers for all clients before queries
   * @returns {void}
   */
  public setWadoHeaders(): void {
    this.clients.forEach(
      client => (client.wadoDicomWebClient.headers = this.getWadoHeader(client))
    );
  }

  /**
   * Sets authorization headers for wado clients before queries
   * @returns {void}
   */
  public setAuthorizationHeadersForWADO(): void {
    this.clients.forEach(
      client => (client.wadoDicomWebClient.headers = this.getAuthorizationHeader())
    );
  }

  /**
   * Returns a boolean indicating if a client have reject abilities
   * @returns {boolean} client reject support
   */
  public clientCanReject(name) {
    return this.getClient(name)?.supportsReject;
  }

  /**
   * Returns the reject function of a client
   * @param name
   * @returns {object} client reject object
   */
  public getClientRejectObject(name) {
    const client = this.getClient(name);
    if (client?.supportsReject) {
      return dcm4cheeReject(client.wadoRoot);
    }
  }

  /**
   * Returns the qido client
   * @param name
   * @returns {object} qido client
   */
  public getQidoClient(name?: string): object {
    const client = this.getClient(name);
    return client?.qidoDicomWebClient;
  }

  /**
   * Returns the wado client
   * @param name
   * @returns {object} wado client
   */
  public getWadoClient(name?: string): object {
    const client = this.getClient(name);
    return client?.wadoDicomWebClient;
  }

  /**
   * Returns the client configuration
   * @param name
   * @returns {object} client configuration
   */
  public getConfig(name?: string): object {
    return name ? this.clients.find(client => client.name === name) : this.clients[0];
  }

  /**
   * Gets the client list already setting the necessary wado headers
   * @returns {Array} client list
   */
  public getClientsForWadoRequests() {
    this.setWadoHeaders();
    return this.getClients();
  }

  /**
   * Gets the client list already setting the necessary qido headers
   * @returns {Array} client list
   */
  public getClientsForQidoRequests() {
    this.setQidoHeaders();
    return this.getClients();
  }

  /**
   * Returns the client list
   * @returns {Array} client list
   */
  public getClients() {
    return this.clients;
  }
  /**
   * Adds a client to client list given a dicomweb server configuration
   * @param configToAdd
   * @returns {void}
   */
  private addClient(configToAdd: ConfigToAdd): void {
    // if no qidoRoot or wadoRoot, don't add the client. Could be the case for
    // configurations that relies on onConfiguration function but lacks necessary
    // additional information
    if (!configToAdd?.qidoRoot || !configToAdd?.wadoRoot) {
      return;
    }
    const config = Object.assign({}, configToAdd);
    config.qidoConfig = {
      url: config.qidoRoot,
      staticWado: config.staticWado,
      singlepart: config.singlepart,
      headers: this.userAuthenticationService.getAuthorizationHeader(),
      errorInterceptor: errorHandler.getHTTPErrorHandler(),
    };

    config.wadoConfig = {
      url: config.wadoRoot,
      staticWado: config.staticWado,
      singlepart: config.singlepart,
      headers: this.userAuthenticationService.getAuthorizationHeader(),
      errorInterceptor: errorHandler.getHTTPErrorHandler(),
    };

    config.qidoDicomWebClient = config.staticWado
      ? new StaticWadoClient(config.qidoConfig)
      : new api.DICOMwebClient(config.qidoConfig);

    config.wadoDicomWebClient = config.staticWado
      ? new StaticWadoClient(config.wadoConfig)
      : new api.DICOMwebClient(config.wadoConfig);

    config.qidoDicomWebClient.name = config.name;
    config.wadoDicomWebClient.name = config.name;
    this.clients.push(config);
  }

  /**
   * Process a dicomweb server configuration and add it to the clients list.
   * This function could change the configuration by calling the onConfiguration,
   * if defined
   * @param {object} params key / pair mapping of the URL parameters
   * @param {object} query URLSearchParams object generated for the URL
   * @param {object} config client configuration
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
   * Get authorization headers for wado and qido calls
   * @returns {object} xhrRequestHeaders
   */
  private getAuthorizationHeader(): object {
    const xhrRequestHeaders = {};
    const authHeaders = this.userAuthenticationService.getAuthorizationHeader();
    if (authHeaders?.Authorization) {
      xhrRequestHeaders.Authorization = authHeaders.Authorization;
    }
    return xhrRequestHeaders;
  }

  /**
   * Generates the header for wado messages for a specific client
   * @param config
   * @returns {object} wado Headers
   */
  private getWadoHeader(config): object {
    const authorizationHeader = this.getAuthorizationHeader();
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
   * Returns the client configuration
   * @param name
   * @returns {object} client configuration
   */
  private getClient(name?: string): object {
    return name ? this.clients.find(client => client.name === name) : this.clients[0];
  }
}
