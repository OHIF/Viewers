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

  // adds a dicomweb server configuration in the clients list
  private _addConfiguration(configToAdd) {
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

  private addConfiguration(params, query, config) {
    if (config.onConfiguration && typeof config.onConfiguration === 'function') {
      config = config.onConfiguration(config, {
        params,
        query,
      });
    }
    this._addConfiguration(config);
  }

  private getAuthorizationHeader() {
    const xhrRequestHeaders = {};
    const authHeaders = this.userAuthenticationService.getAuthorizationHeader();
    if (authHeaders && authHeaders.Authorization) {
      xhrRequestHeaders.Authorization = authHeaders.Authorization;
    }
    return xhrRequestHeaders;
  }

  private generateWadoHeader(config) {
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

  // sets authorization headers before queries
  public setQidoHeaders() {
    this.clients.forEach(
      client => (client.qidoDicomWebClient.headers = this.getAuthorizationHeader())
    );
  }

  public setWadoHeaders() {
    this.clients.forEach(
      client => (client.wadoDicomWebClient.headers = this.generateWadoHeader(client))
    );
  }

  public setAuthorizationHeadersForWADO() {
    this.clients.forEach(
      client => (client.wadoDicomWebClient.headers = this.getAuthorizationHeader())
    );
  }

  // returns if a client can reject
  public clientCanReject() {
    return name => {
      const client = this.clients.find(client => client.name === name);
      return client?.supportsReject;
    };
  }

  // returns reject function of a client given its name
  public getClientReject(name) {
    const client = this.clients.find(client => client.name === name);
    if (client?.supportsReject) {
      return dcm4cheeReject(client.wadoRoot);
    }
  }

  // returns the qido client given the client name
  public getQidoClient(name = undefined) {
    if (this.clients.length) {
      if (name) {
        const client = this.clients.find(client => client.name === name);
        return client?.qidoDicomWebClient;
      } else {
        return this.clients[0].qidoDicomWebClient;
      }
    }
  }

  // returns the wado client given the client name
  public getWadoClient(name = undefined) {
    if (this.clients.length) {
      if (name) {
        const client = this.clients.find(client => client.name === name);
        return client?.wadoDicomWebClient;
      } else {
        return this.clients[0].wadoDicomWebClient;
      }
    }
  }

  // returns client configuration given the client name
  public getClient(name = undefined) {
    if (this.clients.length) {
      if (name) {
        const client = this.clients.find(client => client.name === name);
        return client;
      } else {
        return this.clients[0];
      }
    }
  }

  // returns the client list
  public getClients() {
    return this.clients;
  }
}
