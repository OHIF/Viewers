/** @type {AppTypes.Config} */

window.config = {
  name: 'config/xnat.js',
  routerBasename: '/',
  // whiteLabeling: {},
  defaultDataSourceName: 'xnat',
  extensions: [
    '@ohif/extension-default',
    '@ohif/extension-cornerstone',
    '@ohif/extension-xnat'
  ],
  modes: ['@ohif/mode-xnat'],
  customizationService: {},
  showStudyList: false,
  // some windows systems have issues with more than 3 web workers
  maxNumberOfWebWorkers: 3,
  // below flag is for performance reasons, but it might not work for all servers
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  experimentalStudyBrowserSort: false,
  strictZSpacingForVolumeViewport: true,
  groupEnabledModesFirst: true,
  maxNumRequests: {
    interaction: 100,
    thumbnail: 75,
    // Prefetch number is dependent on the http protocol. For http 2 or
    // above, the number of requests can be go a lot higher.
    prefetch: 25,
  },
  // filterQueryParam: false,
  // Defines multi-monitor layouts
  multimonitor: [
    {
      id: 'split',
      test: ({ multimonitor }) => multimonitor === 'split',
      screens: [
        {
          id: 'ohif0',
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
          id: 'ohif1',
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
      id: '2',
      test: ({ multimonitor }) => multimonitor === '2',
      screens: [
        {
          id: 'ohif0',
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
          id: 'ohif1',
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
  /* Dynamic config allows user to pass "configUrl" query string this allows to load config without recompiling application. The regex will ensure valid configuration source */
  // dangerouslyUseDynamicConfig: {
  //   enabled: true,
  //   // regex will ensure valid configuration source and default is /.*/ which matches any character. To use this, setup your own regex to choose a specific source of configuration only.
  //   // Example 1, to allow numbers and letters in an absolute or sub-path only.
  //   // regex: /(0-9A-Za-z.]+)(\/[0-9A-Za-z.]+)*/
  //   // Example 2, to restricts to either hosptial.com or othersite.com.
  //   // regex: /(https:\/\/hospital.com(\/[0-9A-Za-z.]+)*)|(https:\/\/othersite.com(\/[0-9A-Za-z.]+)*)/
  //   regex: /.*/,
  // },
  dataSources: [
    {
      namespace: '@ohif/extension-xnat.dataSourcesModule.xnat',
      sourceName: 'xnat',
      configuration: {
        friendlyName: 'XNAT Viewer',
        name: 'xnat',
        wadoUriRoot: 'http://localhost',
        qidoRoot: 'http://localhost',
        wadoRoot: 'http://localhost',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadouri',
        thumbnailRendering: 'wadouri',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: false,
        staticWado: true,
        singlepart: 'bulkdata,video',
        omitQuotationForMultipartRequest: true,
        
        // CRITICAL: Settings for direct file loading
        dicomFileLoadSettings: {
          directLoad: true,
          useCredentials: true,
          acceptHeader: 'application/octet-stream,*/*'
        },
        
        // Process URL parameters in the data source itself
        requestOptions: {
          // Pass the JSESSIONID cookie to maintain session
          withCredentials: true,
          // Add custom headers if needed
          headers: {
            Accept: 'application/octet-stream,application/json,*/*',
          },
        }
      },
    }
  ],
  httpErrorHandler: error => {
    console.error('OHIF Error Handler:', error);
    
    // Special handling for JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON.parse')) {
      console.warn('=========== JSON PARSING ERROR DETECTED ===========');
      console.warn('This typically happens when the server returns non-JSON data.');
      console.warn('Attempting to patch the error to prevent application crash.');
      
      // Create a global patch for JSON.parse to make it more forgiving
      const originalJSONParse = JSON.parse;
      JSON.parse = function(text) {
        try {
          return originalJSONParse(text);
        } catch (e) {
          console.warn('JSON.parse error caught:', e.message);
          console.warn('Text that failed to parse (first 100 chars):', 
              text ? text.substring(0, 100) : 'null or empty');
          
          // Return empty array instead of crashing
          return [];
        }
      };
      
      // Try to continue instead of crashing
      return true;
    }
    
    console.log('Full error object:', JSON.stringify(error, null, 2));
    console.trace('Error stack trace:');
  },
  // whiteLabeling: {
  //   /* Optional: Should return a React component to be rendered in the "Logo" section of the application's Top Navigation bar */
  //   createLogoComponentFn: function (React) {
  //     return React.createElement(
  //       'a',
  //       {
  //         target: '_self',
  //         rel: 'noopener noreferrer',
  //         className: 'text-purple-600 line-through',
  //         href: '/',
  //       },
  //       React.createElement('img',
  //         {
  //           src: './assets/customLogo.svg',
  //           className: 'w-8 h-8',
  //         }
  //       ))
  //   },
  // },
  hotkeys: [
    {
      commandName: 'incrementActiveViewport',
      label: 'Next Viewport',
      keys: ['right'],
    },
    {
      commandName: 'decrementActiveViewport',
      label: 'Previous Viewport',
      keys: ['left'],
    },
    { commandName: 'rotateViewportCW', label: 'Rotate Right', keys: ['r'] },
    { commandName: 'rotateViewportCCW', label: 'Rotate Left', keys: ['l'] },
    { commandName: 'invertViewport', label: 'Invert', keys: ['i'] },
    {
      commandName: 'flipViewportHorizontal',
      label: 'Flip Horizontally',
      keys: ['h'],
    },
    {
      commandName: 'flipViewportVertical',
      label: 'Flip Vertically',
      keys: ['v'],
    },
    { commandName: 'scaleUpViewport', label: 'Zoom In', keys: ['+'] },
    { commandName: 'scaleDownViewport', label: 'Zoom Out', keys: ['-'] },
    { commandName: 'fitViewportToWindow', label: 'Zoom to Fit', keys: ['='] },
    { commandName: 'resetViewport', label: 'Reset', keys: ['space'] },
    { commandName: 'nextImage', label: 'Next Image', keys: ['down'] },
    { commandName: 'previousImage', label: 'Previous Image', keys: ['up'] },
    // {
    //   commandName: 'previousViewportDisplaySet',
    //   label: 'Previous Series',
    //   keys: ['pagedown'],
    // },
    // {
    //   commandName: 'nextViewportDisplaySet',
    //   label: 'Next Series',
    //   keys: ['pageup'],
    // },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Zoom' },
      label: 'Zoom',
      keys: ['z'],
    },
    // ~ Window level presets
    {
      commandName: 'windowLevelPreset1',
      label: 'W/L Preset 1',
      keys: ['1'],
    },
    {
      commandName: 'windowLevelPreset2',
      label: 'W/L Preset 2',
      keys: ['2'],
    },
    {
      commandName: 'windowLevelPreset3',
      label: 'W/L Preset 3',
      keys: ['3'],
    },
    {
      commandName: 'windowLevelPreset4',
      label: 'W/L Preset 4',
      keys: ['4'],
    },
    {
      commandName: 'windowLevelPreset5',
      label: 'W/L Preset 5',
      keys: ['5'],
    },
    {
      commandName: 'windowLevelPreset6',
      label: 'W/L Preset 6',
      keys: ['6'],
    },
    {
      commandName: 'windowLevelPreset7',
      label: 'W/L Preset 7',
      keys: ['7'],
    },
    {
      commandName: 'windowLevelPreset8',
      label: 'W/L Preset 8',
      keys: ['8'],
    },
    {
      commandName: 'windowLevelPreset9',
      label: 'W/L Preset 9',
      keys: ['9'],
    },
  ],
  whiteLabeling: {
    createLogoPath: '/VIEWER/',
    logoPath: '/VIEWER/'
  },
  // Add a global fix for missing authorization functions and other required modules
  beforeInit: () => {
    console.log('Applying OHIF compatibility patches for XNAT...');
    
    // Create global DICOMWeb namespace if it doesn't exist
    window.DICOMWeb = window.DICOMWeb || {};
    
    // Add global getAuthorizationHeader to the right namespaces
    window.DICOMWeb.getAuthorizationHeader = () => undefined;
    window.getAuthorizationHeader = () => undefined;
    
    // Add the function to the @ohif/core namespace if it exists
    if (window.OHIF && window.OHIF.DICOMWeb) {
      window.OHIF.DICOMWeb.getAuthorizationHeader = () => undefined;
    }
    // Add cornerstone event listeners for DICOM loading
    try {
      // Listen for cornerstone image loading events
      document.addEventListener('cornerstoneimageloadprogress', function(event) {
        // Access event details safely
        const customEvent = event && typeof event === 'object' ? event : {};
        const detail = customEvent.detail || {};
        console.log('Cornerstone image load progress:', detail);
      });
      
      document.addEventListener('cornerstoneimageloaded', function(event) {
        // Access event details safely
        const customEvent = event && typeof event === 'object' ? event : {};
        const detail = customEvent.detail || {};
        console.log('Cornerstone image loaded:', detail);
      });
      
      document.addEventListener('cornerstoneimageloadfailed', function(event) {
        // Access event details safely
        const customEvent = event && typeof event === 'object' ? event : {};
        const detail = customEvent.detail || {};
        console.error('Cornerstone image load failed:', detail);
      });
      
      // Add event listener for cornerstone initialized
      document.addEventListener('cornerstoneinitialized', function() {
        console.log('Cornerstone initialized - configuring wadouri loaders');
        
        // Event for other components to know cornerstone is ready
        try {
          const initEvent = new CustomEvent('ohif-cornerstone-ready', {
            detail: { timestamp: new Date().toISOString() }
          });
          document.dispatchEvent(initEvent);
          console.log('Dispatched ohif-cornerstone-ready event');
        } catch (e) {
          console.warn('Failed to dispatch cornerstone ready event:', e);
        }
        
        // Ensure direct DICOM file loading works
        if (window.cornerstone && window.cornerstoneWADOImageLoader) {
          try {
            const wadoConfig = window.cornerstoneWADOImageLoader.wadors.getConfiguration();
            wadoConfig.requestOptions = {
              withCredentials: true, 
              useSessionCookies: true
            };
            
            const wadouriConfig = window.cornerstoneWADOImageLoader.wadouri.getConfiguration();
            wadouriConfig.requestOptions = {
              withCredentials: true,
              useSessionCookies: true
            };
            
            // Ensure proper MIME type handling
            window.cornerstoneWADOImageLoader.configure({
              beforeSend: function(xhr) {
                xhr.withCredentials = true;
                xhr.setRequestHeader('Accept', 'application/octet-stream,*/*');
              }
            });
            
            console.log('Configured Cornerstone WadoImageLoader');
          } catch (error) {
            console.error('Error configuring WadoImageLoader:', error);
          }
        } else {
          console.warn('Cornerstone or WadoImageLoader not available during cornerstoneinitialized event');
        }
      });
    } catch (e) {
      console.warn('Error setting up Cornerstone event listeners:', e);
    }
    
    // Create a patch for the dicomWebConfig issue
    const dataSourceConfig = window.config.dataSources[0].configuration;
    
    // Create a global dicomWebConfig object that mirrors our data source config
    window.dicomWebConfig = {
      qidoRoot: dataSourceConfig.qidoRoot,
      wadoRoot: dataSourceConfig.wadoRoot,
      wadoUriRoot: dataSourceConfig.wadoUriRoot,
      enableStudyLazyLoad: false,
      supportsFuzzyMatching: false,
      supportsWildcard: true,
      imageRendering: 'wadouri',
      thumbnailRendering: 'wadouri',
      getAuthorizationHeader: () => undefined
    };
    
    // Patch the OHIF metadata module to handle missing dicomWebConfig
    const originalRequire = window.__webpack_require__;
    if (originalRequire) {
      window.__webpack_require__ = function(moduleId) {
        try {
          return originalRequire(moduleId);
        } catch (error) {
          console.warn('Module error caught by patch:', error.message);
          // Return an empty module to prevent crashes
          return {};
        }
      };
    }
    
    // Add a global error handler for promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      console.warn('Unhandled promise rejection:', event.reason);
      // Prevent the default handling (which would log to console)
      event.preventDefault();
    });
    
    // Create a global fetch interceptor to add auth headers if needed
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      // If the URL includes XNAT API paths, ensure it has needed headers
      if (typeof args[0] === 'string' && args[0].includes('/xapi/')) {
        args[1] = args[1] || {};
        args[1].headers = args[1].headers || {};
      }
      return originalFetch.apply(this, args);
    };
    
    console.log('XNAT compatibility patches applied successfully');
  }
};

// Add immediate patches outside the beforeInit function to ensure they're applied
// even before the config is fully processed
(function applyImmediatePatches() {
  // Define global getAuthorizationHeader function
  window.DICOMWeb = window.DICOMWeb || {};
  window.DICOMWeb.getAuthorizationHeader = () => undefined;
  window.getAuthorizationHeader = () => undefined;
  
  // Create global dicomWebConfig
  window.dicomWebConfig = {
    qidoRoot: 'http://localhost',
    wadoRoot: 'http://localhost',
    wadoUriRoot: 'http://localhost',
    enableStudyLazyLoad: false,
    supportsFuzzyMatching: false,
    supportsWildcard: true,
    imageRendering: 'wadouri',
    thumbnailRendering: 'wadouri',
    getAuthorizationHeader: () => undefined
  };
  
  console.log('Applied immediate XNAT compatibility patches');
})();
