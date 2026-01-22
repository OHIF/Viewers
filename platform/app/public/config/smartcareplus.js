/** @type {AppTypes.Config} */

/**
 * SmartCarePlus OHIF Viewer Configuration
 *
 * This configuration file is optimized for SmartCarePlus - A Complete Health Ecosystem
 * Radiology Module: Advanced Medical Imaging Viewer
 *
 * Features enabled:
 * - Multi-monitor support for radiology workstations
 * - Advanced segmentation and measurement tracking
 * - Production-ready performance optimizations
 * - SmartCarePlus branding and white-labeling
 * - Multiple data source support (Cloud + Local PACS)
 */

window.config = {
  name: 'SmartCarePlus Radiology Viewer',
  routerBasename: null,

  // SmartCarePlus White Labeling Configuration
  whiteLabeling: {
    createLogoComponentFn: function (React) {
      return React.createElement(
        'a',
        {
          target: '_self',
          rel: 'noopener noreferrer',
          className: 'flex items-center',
          href: '/',
          title: 'SmartCarePlus - Complete Health Ecosystem'
        },
        React.createElement('img', {
          src: './assets/smartcareplus-logo.png',
          alt: 'SmartCarePlus',
          className: 'h-8',
          // Fallback to text if logo not available
          onerror: "this.onerror=null; this.outerHTML='<span class=\"text-xl font-bold text-primary-light\">SmartCare<span class=\"text-primary-main\">Plus</span></span>';"
        })
      );
    },
  },

  extensions: [],
  modes: [],

  // Customization service for SmartCarePlus-specific UI/UX
  customizationService: {
    // Restrict study browser to only show the current study's series
    'studyBrowser.studyMode': 'primary',
    // Hide the entire header in the study browser (thumbnails/list toggle and settings)
    'studyBrowser.hideHeader': true,
    // Hide the settings icon in the study browser to prevent switching study lists
    'studyBrowser.actionIcons': [],
  },

  // Study list is disabled for embedded integration
  showStudyList: false,

  // Mode configurations to hide panels and customize behavior
  modesConfiguration: {
    '@ohif/mode-basic': {
      routes: {
        0: {
          layoutInstance: {
            props: {
              leftPanels: { $set: ['@ohif/extension-default.panelModule.seriesList'] }, // Restore the series list
              leftPanelClosed: { $set: false },
            },
          },
        },
      },
    },
    '@ohif/mode-longitudinal': {
      routes: {
        0: {
          layoutInstance: {
            props: {
              leftPanels: { $set: ['@ohif/extension-default.panelModule.seriesList'] }, // Restore the series list
              leftPanelClosed: { $set: false },
            },
          },
        },
      },
    },
  },

  // Performance optimizations for production
  maxNumberOfWebWorkers: 4, // Increased for better performance on modern systems
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,

  // Enable experimental features for better UX
  experimentalStudyBrowserSort: true, // Enable for better study organization
  strictZSpacingForVolumeViewport: true,
  groupEnabledModesFirst: true,
  allowMultiSelectExport: true, // Enable batch export for radiologists

  // Request throttling optimized for healthcare networks
  maxNumRequests: {
    interaction: 100,
    thumbnail: 75,
    prefetch: 40, // Increased for HTTP/2 support and faster loading
  },

  // Show detailed errors for debugging (change to 'production' to hide details)
  showErrorDetails: 'always',

  // Multi-monitor support for radiology reading rooms
  multimonitor: [
    {
      id: 'split',
      test: ({ multimonitor }) => multimonitor === 'split',
      screens: [
        {
          id: 'smartcareplus-primary',
          screen: null,
          location: {
            screen: 0,
            width: 0.5,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
        {
          id: 'smartcareplus-secondary',
          screen: null,
          location: {
            width: 0.5,
            height: 1,
            left: 0.5,
            top: 0,
          },
          options: 'location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
      ],
    },
    {
      id: 'dual',
      test: ({ multimonitor }) => multimonitor === 'dual' || multimonitor === '2',
      screens: [
        {
          id: 'smartcareplus-monitor-1',
          screen: 0,
          location: {
            width: 1,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'fullscreen=yes,location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
        {
          id: 'smartcareplus-monitor-2',
          screen: 1,
          location: {
            width: 1,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'fullscreen=yes,location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
      ],
    },
  ],

  // Default data source - update this when SmartCarePlus PACS is configured
  defaultDataSourceName: 'smartcareplus-pacs',

  // Data Sources Configuration
  dataSources: [
    // Primary SmartCarePlus PACS Server (GCP)
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'smartcareplus-pacs',
      configuration: {
        friendlyName: 'SmartCarePlus PACS Server',
        name: 'smartcareplus-gcp',
        // Production SmartCarePlus PACS API (GCP)
        wadoUriRoot: 'https://api.imaging.smartcareplus.in/gcp/dicomweb',
        qidoRoot: 'https://api.imaging.smartcareplus.in/gcp/dicomweb',
        wadoRoot: 'https://api.imaging.smartcareplus.in/gcp/dicomweb',
        qidoSupportsIncludeField: true,
        supportsReject: true,
        supportsStow: false, // Disable DICOM upload for embedded view
        dicomUploadEnabled: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        omitQuotationForMultipartRequest: true,
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies',
        },
      },
    },


    // Utility Data Sources
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomwebproxy',
      sourceName: 'dicomwebproxy',
      configuration: {
        friendlyName: 'DICOMweb Proxy',
        name: 'dicomwebproxy',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'DICOM JSON',
        name: 'json',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'Local Files',
      },
    },
  ],

  // Enhanced error handling for healthcare context
  httpErrorHandler: error => {
    console.error('[SmartCarePlus] HTTP Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.config?.url,
      timestamp: new Date().toISOString(),
    });

    // Handle specific error codes relevant to healthcare systems
    switch (error.status) {
      case 401:
        console.warn('[SmartCarePlus] Authentication required. Please log in.');
        // TODO: Redirect to SmartCarePlus login
        break;
      case 403:
        console.warn('[SmartCarePlus] Access denied. Check user permissions.');
        break;
      case 404:
        console.warn('[SmartCarePlus] Study or series not found.');
        break;
      case 429:
        console.warn('[SmartCarePlus] Rate limit exceeded. Please wait before retrying.');
        break;
      case 500:
      case 502:
      case 503:
        console.error('[SmartCarePlus] Server error. Please contact support if this persists.');
        break;
      default:
        console.warn('[SmartCarePlus] An error occurred while loading imaging data.');
    }
  },

  // Segmentation configuration for advanced imaging analysis
  segmentation: {
    segmentLabel: {
      enabledByDefault: true,
      labelColor: [0, 150, 255, 1], // SmartCarePlus blue
      hoverTimeout: 500, // ms
      background: 'rgba(0, 150, 255, 0.2)',
    },
  },
};
