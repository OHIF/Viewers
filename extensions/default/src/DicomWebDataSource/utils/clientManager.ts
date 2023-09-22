import { api } from 'dicomweb-client';
import StaticWadoClient from './StaticWadoClient';
import dcm4cheeReject from '../dcm4cheeReject';
import { errorHandler, utils } from '@ohif/core';

export default class ClientManager {
  clients;
  userAuthenticationService;

  constructor({ params, query, dicomWebConfig, userAuthenticationService }) {
    this.clients = [];
    this.userAuthenticationService = userAuthenticationService;
    if (Array.isArray(dicomWebConfig)) {
      dicomWebConfig.forEach(config => this.addConfiguration(params, query, config));
    } else {
      this.addConfiguration(params, query, dicomWebConfig);
    }
  }

  /**
   * Adds a dicomweb server configuration in the clients list
   * @param configToAdd
   */
  private _addConfiguration(configToAdd): void {
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
   * Adds a dicomweb server configuration in the clients list. This function
   * could change the configuration by calling the onConfiguration, if defined
   * @param params
   * @param query
   * @param config
   */
  private addConfiguration(params, query, config): void {
    if (config.onConfiguration && typeof config.onConfiguration === 'function') {
      config = config.onConfiguration(config, {
        params,
        query,
      });
    }
    this._addConfiguration(config);
  }

  /**
   * Get authorization headers for wado and qido calls
   * @returns
   */
  private getAuthorizationHeader(): object {
    const xhrRequestHeaders = {};
    const authHeaders = this.userAuthenticationService.getAuthorizationHeader();
    if (authHeaders && authHeaders.Authorization) {
      xhrRequestHeaders.Authorization = authHeaders.Authorization;
    }
    return xhrRequestHeaders;
  }

  /**
   * Generates the header for wado messages for a specific client
   * @param config
   * @returns
   */
  private generateWadoHeader(config): object {
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
   * Sets authorization headers for all clients before queries
   */
  public setQidoHeaders(): void {
    this.clients.forEach(
      client => (client.qidoDicomWebClient.headers = this.getAuthorizationHeader())
    );
  }

  /**
   * Sets wado headers for all clients before queries
   */
  public setWadoHeaders(): void {
    this.clients.forEach(
      client => (client.wadoDicomWebClient.headers = this.generateWadoHeader(client))
    );
  }

  /**
   * Sets authorization headers for wado clients before queries
   */
  public setAuthorizationHeadersForWADO(): void {
    this.clients.forEach(
      client => (client.wadoDicomWebClient.headers = this.getAuthorizationHeader())
    );
  }

  /**
   * Returns a function that returns if a client have reject abilities
   * @returns
   */
  public clientCanReject() {
    return name => {
      const client = this.clients.find(client => client.name === name);
      return client?.supportsReject;
    };
  }

  /**
   * Returns reject function of a client
   * @param name
   * @returns
   */
  public getClientReject(name) {
    const client = this.clients.find(client => client.name === name);
    if (client?.supportsReject) {
      return dcm4cheeReject(client.wadoRoot);
    }
  }

  /**
   * Returns the qido client
   * @param name
   * @returns
   */
  public getQidoClient(name = undefined): object {
    if (this.clients.length) {
      if (name) {
        const client = this.clients.find(client => client.name === name);
        return client?.qidoDicomWebClient;
      } else {
        return this.clients[0].qidoDicomWebClient;
      }
    }
  }

  /**
   * Returns the wado client
   * @param name
   * @returns
   */
  public getWadoClient(name = undefined): object {
    if (this.clients.length) {
      if (name) {
        const client = this.clients.find(client => client.name === name);
        return client?.wadoDicomWebClient;
      } else {
        return this.clients[0].wadoDicomWebClient;
      }
    }
  }

  /**
   * Returns the client configuration
   * @param name
   * @returns
   */
  public getClient(name = undefined): object {
    if (this.clients.length) {
      if (name) {
        const client = this.clients.find(client => client.name === name);
        return client;
      } else {
        return this.clients[0];
      }
    }
  }

  /**
   * Returns the client list
   * @returns
   */
  public getClients() {
    return this.clients;
  }
}
