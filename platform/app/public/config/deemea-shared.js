/**
 * Shared helpers for Deemea OHIF configs (default.js, dev.js, qa.js, prod.js).
 * Loaded as a plain script — exposes helpers on window.deemeaConfig.
 */
(function () {
  /**
   * Builds a dicomweb data source entry for a Didier endpoint.
   * @param {string} sourceName - The OHIF sourceName (used in the URL: /deemea/<sourceName>)
   * @param {string} rootUrl - The Didier dicomweb root URL (e.g. https://xxx.deemea.com/api/v1/didier)
   * @param {object} [overrides] - Optional configuration overrides (e.g. { supportsReject: true })
   */
  function createDidierDataSource(sourceName, rootUrl, overrides) {
    return {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: sourceName,
      configuration: Object.assign(
        {
          friendlyName: sourceName.toLowerCase() + '-didier',
          name: sourceName.toLowerCase() + '-didier',
          wadoUriRoot: rootUrl,
          qidoRoot: rootUrl,
          wadoRoot: rootUrl,
          qidoSupportsIncludeField: false,
          imageRendering: 'wadors',
          thumbnailRendering: 'wadors',
          enableStudyLazyLoad: true,
          supportsFuzzyMatching: true,
          supportsWildcard: false,
          staticWado: true,
          singlepart: 'bulkdata,video',
          bulkDataURI: {
            enabled: true,
            relativeResolution: 'studies',
            transform: url => url.replace('/pixeldata.mp4', '/rendered'),
          },
          omitQuotationForMultipartRequest: true,
        },
        overrides || {}
      ),
    };
  }

  /**
   * Builds datasources from a map of { SOURCE_NAME: rootUrl | { url, ...overrides } }.
   */
  function createDataSources(map) {
    return Object.keys(map).map(sourceName => {
      const value = map[sourceName];
      if (typeof value === 'string') {
        return createDidierDataSource(sourceName, value);
      }
      const { url, ...overrides } = value;
      return createDidierDataSource(sourceName, url, overrides);
    });
  }

  /** Base config shared by all environments. */
  const baseConfig = {
    routerBasename: null,
    extensions: [],
    modes: [],
    customizationService: {},
    showStudyList: false,
    maxNumberOfWebWorkers: 3,
    showWarningMessageForCrossOrigin: true,
    showCPUFallbackMessage: true,
    showLoadingIndicator: true,
    experimentalStudyBrowserSort: false,
    strictZSpacingForVolumeViewport: true,
    useSharedArrayBuffer: 'FALSE',
    groupEnabledModesFirst: true,
    allowMultiSelectExport: false,
    dicomUploadEnabled: true,
    investigationalUseDialog: { option: 'never' },
    disableConfirmationPrompts: true,
    maxNumRequests: {
      interaction: 300,
      thumbnail: 2,
      prefetch: 30,
    },
    studyPrefetcher: {
      enabled: true,
      displaySetsCount: 4,
      maxNumPrefetchRequests: 20,
      order: 'closest',
    },
  };

  window.deemeaConfig = {
    baseConfig: baseConfig,
    createDidierDataSource: createDidierDataSource,
    createDataSources: createDataSources,
  };
})();
