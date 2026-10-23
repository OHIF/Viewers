import { createDicomWebApi } from './index';

// The data source imports the image loader for its multiframe Part 10 prefetch
// path, and that module's codec wasm entrypoints are not resolvable under jest.
// These tests only assert URLs, so a bare stub is enough.
jest.mock('@cornerstonejs/dicom-image-loader', () => ({
  __esModule: true,
  default: { prefetchPart10Instance: jest.fn() },
}));

// Only the pieces the module graph destructures at import time, plus enough to
// let a QIDO search return an empty result set. These tests assert URLs, so no
// DICOM value parsing is exercised.
jest.mock('@ohif/core', () => ({
  DicomMetadataStore: { addSeriesMetadata: jest.fn(), addInstances: jest.fn() },
  // The data source wraps its implementation object; return it unchanged so the
  // test can reach `retrieve.getWadoDicomWebClient()`.
  IWebApiDataSource: { create: implementation => implementation },
  DICOMWeb: {
    getString: element => element?.Value?.[0],
    getName: element => element?.Value?.[0],
    getModalities: (...elements) => elements.find(Boolean),
  },
  utils: {
    generateAcceptHeader: jest.fn(() => 'application/dicom+json'),
    formatDate: date => date,
  },
  errorHandler: { getHTTPErrorHandler: jest.fn(() => jest.fn()) },
  classes: { MetadataProvider: { addImageIdToUIDs: jest.fn() } },
}));

const servicesManager = {
  services: {
    userAuthenticationService: { getAuthorizationHeader: () => ({}) },
  },
};

/**
 * Builds an initialized data source and returns it alongside the single
 * DICOMweb client it configured.
 */
function initDataSource(config) {
  const dataSource = createDicomWebApi(config, servicesManager);
  dataSource.initialize({});
  return { dataSource, client: dataSource.retrieve.getWadoDicomWebClient() };
}

describe('DicomWebDataSource service URLs', () => {
  it('routes each service to its own root when qidoRoot and wadoRoot differ', () => {
    const { client } = initDataSource({
      qidoRoot: 'https://server.com/qidors/org1',
      wadoRoot: 'https://server.com/wadors/org1',
    });

    expect(client.qidoURL).toBe('https://server.com/qidors/org1');
    expect(client.wadoURL).toBe('https://server.com/wadors/org1');
    // No stowRoot configured, so STOW keeps the pre-existing wadoRoot behaviour.
    expect(client.stowURL).toBe('https://server.com/wadors/org1');
  });

  it('uses an explicit stowRoot for STOW only', () => {
    const { client } = initDataSource({
      qidoRoot: 'https://server.com/qidors/org1',
      wadoRoot: 'https://server.com/wadors/org1',
      stowRoot: 'https://server.com/stowrs/org1',
    });

    expect(client.qidoURL).toBe('https://server.com/qidors/org1');
    expect(client.wadoURL).toBe('https://server.com/wadors/org1');
    expect(client.stowURL).toBe('https://server.com/stowrs/org1');
  });

  it('points every service at the shared root when the roots are the same', () => {
    const { client } = initDataSource({
      qidoRoot: 'https://server.com/dicomweb',
      wadoRoot: 'https://server.com/dicomweb',
    });

    expect(client.qidoURL).toBe('https://server.com/dicomweb');
    expect(client.wadoURL).toBe('https://server.com/dicomweb');
    expect(client.stowURL).toBe('https://server.com/dicomweb');
  });

  it('leaves no service URL undefined when only one root is configured', () => {
    const { client: qidoOnly } = initDataSource({ qidoRoot: 'https://server.com/qidors' });
    expect(qidoOnly.qidoURL).toBe('https://server.com/qidors');
    expect(qidoOnly.wadoURL).toBe('https://server.com/qidors');
    expect(qidoOnly.stowURL).toBe('https://server.com/qidors');

    const { client: wadoOnly } = initDataSource({ wadoRoot: 'https://server.com/wadors' });
    expect(wadoOnly.qidoURL).toBe('https://server.com/wadors');
    expect(wadoOnly.wadoURL).toBe('https://server.com/wadors');
    expect(wadoOnly.stowURL).toBe('https://server.com/wadors');
  });

  /**
   * Regression test for the reported failure: the series search issued while
   * loading study metadata resolves against `qidoURL`, and previously ran on a
   * client whose qidoURL was wadoRoot, producing
   * `https://server.com/wadors/org1/studies/{uid}/series?...` -> 400.
   */
  it('issues QIDO series searches against qidoRoot', async () => {
    const { dataSource, client } = initDataSource({
      qidoRoot: 'https://server.com/qidors/org1',
      wadoRoot: 'https://server.com/wadors/org1',
    });

    const requestedUrls: string[] = [];
    client._httpGetApplicationJson = url => {
      requestedUrls.push(url);
      return Promise.resolve([]);
    };

    await dataSource.query.series.search('1.2.3');

    expect(requestedUrls).toHaveLength(1);
    // The loader appends `includefield` query params; only the endpoint matters here.
    const [requestedPath] = requestedUrls[0].split('?');
    expect(requestedPath).toBe('https://server.com/qidors/org1/studies/1.2.3/series');
  });

  it('retrieves WADO series metadata against wadoRoot', async () => {
    const { client } = initDataSource({
      qidoRoot: 'https://server.com/qidors/org1',
      wadoRoot: 'https://server.com/wadors/org1',
    });

    const requestedUrls: string[] = [];
    client._httpGetApplicationJson = url => {
      requestedUrls.push(url);
      return Promise.resolve([]);
    };

    await client.retrieveSeriesMetadata({
      studyInstanceUID: '1.2.3',
      seriesInstanceUID: '4.5.6',
    });

    expect(requestedUrls[0]).toBe(
      'https://server.com/wadors/org1/studies/1.2.3/series/4.5.6/metadata'
    );
  });
});
