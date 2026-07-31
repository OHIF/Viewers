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

  /**
   * Builds datasources with dynamic endpoint switching (didier/diego).
   * Reads 'endpoint' query parameter and replaces /didier with the requested endpoint.
   * Defaults to 'didier' if no parameter is provided.
   * @param {object} map - The datasources map (same format as createDataSources)
   */
  function getDynamicDataSources(map) {
    const urlParams = new URLSearchParams(window.location.search);
    const endpoint = urlParams.get('endpoint') || 'didier';

    // Replace /didier with the requested endpoint in all URLs
    const updatedMap = {};
    Object.keys(map).forEach(key => {
      const value = map[key];
      if (typeof value === 'string') {
        updatedMap[key] = value.replace(/\/didier/, `/${endpoint}`);
      } else {
        updatedMap[key] = {
          ...value,
          url: value.url.replace(/\/didier/, `/${endpoint}`),
        };
      }
    });

    return createDataSources(updatedMap);
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
    getDynamicDataSources: getDynamicDataSources,
  };
})();
