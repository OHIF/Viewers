import { api } from 'dicomweb-client';
import { utils, errorHandler } from '@ohif/core';
import StaticWadoClient from '../DicomWebDataSource/utils/StaticWadoClient';
import type { XNATDataSourceConfig } from './types';

/**
 * Configuration and initialization logic for XNATDataSource
 */
export class XNATDataSourceConfigManager {
    private xnatConfig: XNATDataSourceConfig;
    private xnatConfigCopy: XNATDataSourceConfig;
    private userAuthenticationService: any;
    private authorizationHeaderFn: () => Record<string, string>;
    private wadoHeaderFn: () => Record<string, string>;
    private qidoConfig: any;
    private wadoConfig: any;
    private qidoDicomWebClient: any;
    private wadoDicomWebClient: any;

    constructor(xnatConfig: XNATDataSourceConfig, userAuthenticationService: any) {
        this.xnatConfig = xnatConfig;
        this.userAuthenticationService = userAuthenticationService;

        // Default to enabling bulk data retrieves
        this.xnatConfig.bulkDataURI ||= { enabled: true };
        this.xnatConfigCopy = { ...this.xnatConfig };
    }

    /**
     * Initialize the configuration with params and query
     */
    initialize({ params, query }: { params?: any; query?: any }) {
        const { setupDisplaySetLogging } = require('./Utils/DataSourceUtils');

        setupDisplaySetLogging();

        this.xnatConfig.xnat = this.xnatConfig.xnat || {};

        const queryProjectId = params?.projectId || query?.get('projectId');
        const queryExperimentId = params?.experimentId || query?.get('experimentId');
        const querySessionId = params?.sessionId || query?.get('sessionId');
        const querySubjectId = params?.subjectId || query?.get('subjectId');

        if (queryProjectId) this.xnatConfig.xnat.projectId = queryProjectId;
        if (queryExperimentId) this.xnatConfig.xnat.experimentId = queryExperimentId;
        if (querySessionId) this.xnatConfig.xnat.sessionId = querySessionId;
        if (querySubjectId) this.xnatConfig.xnat.subjectId = querySubjectId;

        if (this.xnatConfig.onConfiguration && typeof this.xnatConfig.onConfiguration === 'function') {
            this.xnatConfig = this.xnatConfig.onConfiguration(this.xnatConfig, {
                params,
                query,
            });
        }

        this.xnatConfigCopy = JSON.parse(JSON.stringify(this.xnatConfig));

        this.setupAuthorizationHeaders();
        this.setupClients();
    }

    /**
     * Set up authorization header functions
     */
    private setupAuthorizationHeaders() {
        this.authorizationHeaderFn = () => {
            const xhrRequestHeaders: Record<string, string> = {};
            const authHeaders = this.userAuthenticationService.getAuthorizationHeader();
            if (authHeaders && typeof authHeaders === 'object' && 'Authorization' in authHeaders && authHeaders.Authorization) {
                xhrRequestHeaders.Authorization = authHeaders.Authorization as string;
            }
            return xhrRequestHeaders;
        };

        this.wadoHeaderFn = () => {
            const authorizationHeader = this.authorizationHeaderFn();
            //Generate accept header depending on config params
            const formattedAcceptHeader = utils.generateAcceptHeader(
                this.xnatConfig.acceptHeader,
                this.xnatConfig.requestTransferSyntaxUID,
                this.xnatConfig.omitQuotationForMultipartRequest
            );

            return {
                ...authorizationHeader,
                Accept: formattedAcceptHeader.join(', '), // Join array into string
            };
        };
    }

    /**
     * Set up QIDO and WADO clients
     */
    private setupClients() {
        this.qidoConfig = {
            url: this.xnatConfig.qidoRoot,
            staticWado: this.xnatConfig.staticWado,
            singlepart: this.xnatConfig.singlepart,
            headers: this.userAuthenticationService.getAuthorizationHeader(),
            errorInterceptor: errorHandler.getHTTPErrorHandler(),
            supportsFuzzyMatching: this.xnatConfig.supportsFuzzyMatching,
        };

        this.wadoConfig = {
            url: this.xnatConfig.wadoRoot,
            staticWado: this.xnatConfig.staticWado,
            singlepart: this.xnatConfig.singlepart,
            headers: this.userAuthenticationService.getAuthorizationHeader(),
            errorInterceptor: errorHandler.getHTTPErrorHandler(),
            supportsFuzzyMatching: this.xnatConfig.supportsFuzzyMatching,
        };

        this.qidoDicomWebClient = this.xnatConfig.staticWado
            ? new StaticWadoClient(this.qidoConfig)
            : new api.DICOMwebClient(this.qidoConfig);

        this.wadoDicomWebClient = this.xnatConfig.staticWado
            ? new StaticWadoClient(this.wadoConfig)
            : new api.DICOMwebClient(this.wadoConfig);
    }

    /**
     * Getters for accessing configuration and clients
     */
    getConfig() {
        return this.xnatConfigCopy;
    }

    getAuthorizationHeader() {
        return this.authorizationHeaderFn();
    }

    getWadoHeader() {
        return this.wadoHeaderFn();
    }

    getQidoClient() {
        return this.qidoDicomWebClient;
    }

    getWadoClient() {
        return this.wadoDicomWebClient;
    }

    /**
     * Update client headers (useful when auth tokens change)
     */
    updateClientHeaders() {
        if (this.qidoDicomWebClient) {
            this.qidoDicomWebClient.headers = this.getAuthorizationHeader();
        }
        if (this.wadoDicomWebClient) {
            this.wadoDicomWebClient.headers = this.getAuthorizationHeader();
        }
    }
}
