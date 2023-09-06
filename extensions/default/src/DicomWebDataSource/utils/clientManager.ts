import { api } from 'dicomweb-client';
import StaticWadoClient from './StaticWadoClient';
import dcm4cheeReject from '../dcm4cheeReject';

import { errorHandler, utils } from '@ohif/core';

export default class clientManager {

  clients;
  userAuthenticationService;

  public addConfiguration(params, query, config) {
    if (config.onConfiguration && typeof config.onConfiguration === 'function') {
      config = config.onConfiguration(config, {
        params,
        query,
      });
    }
    config.copy = JSON.parse(JSON.stringify(config));

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

    // TODO -> Two clients sucks, but its better than 1000.
    // TODO -> We'll need to merge auth later.
    config.qidoDicomWebClient = config.staticWado
      ? new StaticWadoClient(config.qidoConfig)
      : new api.DICOMwebClient(config.qidoConfig);

      config.wadoDicomWebClient = config.staticWado
      ? new StaticWadoClient(config.wadoConfig)
      : new api.DICOMwebClient(config.wadoConfig);

    this.clients.push(config);
  }

  public getAuthorizationHeader() {
    const xhrRequestHeaders = {};
    const authHeaders = this.userAuthenticationService.getAuthorizationHeader();
    if (authHeaders && authHeaders.Authorization) {
      xhrRequestHeaders.Authorization = authHeaders.Authorization;
    }
    return xhrRequestHeaders;
  };

  public generateWadoHeader(config) {
    let authorizationHeader = this.getAuthorizationHeader();
    //Generate accept header depending on config params
    let formattedAcceptHeader = utils.generateAcceptHeader(
      config.acceptHeader,
      config.requestTransferSyntaxUID,
      config.omitQuotationForMultipartRequest
    );

    return {
      ...authorizationHeader,
      Accept: formattedAcceptHeader,
    };
  };

  public setQidoHeaders() {
    this.clients.forEach(
      (client) => client.qidoDicomWebClient.headers = this.getAuthorizationHeader()
    )
  }

  public setWadoHeaders(tipo = 1) {
      if (tipo === 1) {
        this.clients.forEach(
          (client) => client.wadoDicomWebClient.headers = this.generateWadoHeader(client)
        )
      } else {
        this.clients.forEach(
          (client) => client.wadoDicomWebClient.headers = this.getAuthorizationHeader()
        )
      }
  }

  public reject() {
    this.clients.forEach(
      (config) => {
        if (config.supportsReject) {
          dcm4cheeReject(config.wadoRoot);
        }
      }
    )
  }

  public getQidoClient() {
    if (this.clients.length) {
      return this.clients[0].qidoDicomWebClient;
    }
  }

  public getWadoClient() {
    if (this.clients.length) {
      return this.clients[0].wadoDicomWebClient;
    }
  }

  public getDefaultConfig() {
    if (this.clients.length) {
      return this.clients[0];
    }
  }

  public getConfig() {
    if (this.clients.length) {
      return this.clients[0].copy;
    }
  }

  constructor({ params, query, dicomWebConfig, userAuthenticationService }) {
    this.clients = [];
    this.userAuthenticationService = userAuthenticationService;
    if (Array.isArray(dicomWebConfig)) {
      dicomWebConfig.forEach(
        (config) => this.addConfiguration(params, query, config)
      )
    } else {
      this.addConfiguration(params, query, dicomWebConfig);
    }
  }

}
