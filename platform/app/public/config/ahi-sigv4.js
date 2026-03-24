/** @type {AppTypes.Config} */

/**
 * AWS HealthImaging (AHI) Configuration with Browser SigV4 Signing
 *
 * This configuration enables direct browser-to-AHI communication using SigV4 signed requests.
 * The signer is automatically initialized from URL parameters in index.js.
 *
 * == Mode 1: Direct Credentials in URL ==
 * Required URL parameters:
 * - region: AWS region (e.g., us-east-1)
 * - datastoreId: AHI datastore ID
 * - accessKeyId: Temporary AWS access key
 * - secretAccessKey: Temporary AWS secret key
 * - sessionToken: AWS session token
 * - expiration: Credential expiration timestamp (optional, Unix epoch seconds)
 *
 * Example URL:
 * /viewer?StudyInstanceUIDs=1.2.3&region=us-east-1&datastoreId=abc123&accessKeyId=AKIA...&secretAccessKey=...&sessionToken=...
 *
 * == Mode 2: Backend Credential Fetch ==
 * Required URL parameters:
 * - backendUrl: URL to your credential service (or set in config below) dicomcurie
 * - orgId: Organization ID for credential scoping
 * - studyUid or StudyInstanceUIDs: Study UID for credential scoping
 * - token: JWT token for credential scoping
 *
 * Example URL:
 * /viewer?StudyInstanceUIDs=1.2.3&backendUrl=https://api.example.com&orgId=org123
 */

window.config = {
  routerBasename: null,
  extensions: [],
  modes: [],
  showStudyList: false,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  defaultDataSourceName: 'ahi',

  // AHI Plugin Configuration
  // The AHI plugin is loaded dynamically from the pluginUrl.
  // This keeps all AHI-specific code external to the OHIF source.
  ahi: {
    // Enable/disable AHI plugin loading
    enabled: true,
    // URL to the AHI plugin script (can be external URL or relative path)
    pluginUrl: '/viewer/plugins/ahi/ahi-plugin.js',
    // Default AWS region - can be overridden via URL params
    defaultRegion: 'us-east-1',
    // Credential refresh buffer in seconds (refresh 10s before expiration)
    refreshBufferSeconds: 10,
    // Custom AHI endpoint (for non-standard AWS HealthImaging URLs)
    customEndpoint: 'https://dicom-medical-imaging.us-east-1.amazonaws.com',
    // Optional: Backend URL for credential fetch (can also be passed via URL param)
    // backendUrl: 'https://your-backend.example.com',
  },

  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'ahi',
      configuration: {
        friendlyName: 'AWS HealthImaging',
        name: 'ahi',
        // These URLs are dynamically set during initialization from URL params
        qidoRoot: '',
        wadoRoot: '',
        wadoUriRoot: '',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: false,
        supportsReject: false,
        dicomUploadEnabled: false,
        singlepart: 'bulkdata,video,pdf,image/jphc',
        omitQuotationForMultipartRequest: true,
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'dicom json',
        name: 'json',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'dicom local',
      },
    },
  ],

  httpErrorHandler: error => {
    console.error('[AHI] HTTP Error:', error.status, error.statusText);

    if (error.status === 403) {
      console.error('[AHI] Signature validation failed - credentials may have expired');
    } else if (error.status === 401) {
      console.error('[AHI] Authentication failed - invalid credentials');
    }
  },
};
