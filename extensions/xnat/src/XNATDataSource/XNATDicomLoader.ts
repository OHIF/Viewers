/**
 * XNATDicomLoader.ts
 * 
 * This module provides an integration point for XNAT-specific DICOM loading behavior
 * without directly initializing Cornerstone. It follows the pattern of the DicomWebDataSource
 * where Cornerstone initialization is handled elsewhere in the application.
 */

// Define the services manager interface
interface ServicesManager {
  services: Record<string, any>;
}

/**
 * Initializes the XNAT DICOM loader functionality
 * This is a lightweight adapter that doesn't directly initialize Cornerstone
 *
 * @param servicesManager The services manager
 */
export function initXNATDicomLoader(servicesManager: ServicesManager): void {
  console.log('XNAT: Initializing XNAT DICOM loader adapter');
  
  const { userAuthenticationService, uiNotificationService } = servicesManager.services;
  
  if (!userAuthenticationService) {
    console.warn('XNAT: User authentication service not available for XNAT DICOM loader');
    return;
  }
  
  try {
    // Check if cornerstone and its image loader are available globally
    if (window.cornerstone && window.cornerstoneWADOImageLoader) {
      console.log('XNAT: Configuring WADO image loader for XNAT URLs');
      
      // Configure the wadors loader
      const wadorsConfig = window.cornerstoneWADOImageLoader.wadors.getConfiguration();
      wadorsConfig.requestOptions = {
        ...wadorsConfig.requestOptions,
        withCredentials: true,
        useSessionCookies: true
      };
      
      // Configure the wadouri loader
      const wadouriConfig = window.cornerstoneWADOImageLoader.wadouri.getConfiguration();
      wadouriConfig.requestOptions = {
        ...wadouriConfig.requestOptions,
        withCredentials: true,
        useSessionCookies: true
      };
      
      // Configure global beforeSend for all requests
      window.cornerstoneWADOImageLoader.configure({
        beforeSend: function(xhr) {
          // Apply credentials
          xhr.withCredentials = true;
          
          // Set appropriate headers for DICOM
          xhr.setRequestHeader('Accept', 'application/octet-stream,*/*');
          
          // Add authentication headers if available through the service
          const headers = userAuthenticationService.getAuthorizationHeader();
          if (headers) {
            Object.keys(headers).forEach(key => {
              xhr.setRequestHeader(key, headers[key]);
            });
          }
        }
      });
      
      console.log('XNAT: WADO image loader configured successfully');
    } else {
      console.warn('XNAT: Cornerstone or WADO image loader not available - cannot configure');
    }
    
    // Dispatch an event that our XNAT DICOM loader is initialized
    // This allows other components to react if needed
    const event = new CustomEvent('xnatDicomLoaderInitialized', {
      detail: {
        timestamp: new Date().toISOString(),
        loaderType: 'xnat'
      }
    });
    
    document.dispatchEvent(event);
    console.log('XNAT: Dispatched xnatDicomLoaderInitialized event');
    
    // Register for cornerstone initialized event to ensure we're ready
    document.addEventListener('cornerstoneinitialized', function() {
      console.log('XNAT: Received cornerstoneinitialized event, ensuring loaders are configured');
      
      if (window.cornerstone && window.cornerstoneWADOImageLoader) {
        // Reconfigure to be sure
        const wadoConfig = window.cornerstoneWADOImageLoader.wadouri.getConfiguration();
        wadoConfig.requestOptions = {
          withCredentials: true,
          useSessionCookies: true
        };
        
        console.log('XNAT: Reconfigured Cornerstone WadoImageLoader during initialization');
      }
    });
    
    // Show a notification if the UI service is available
    if (uiNotificationService) {
      uiNotificationService.show({
        title: 'XNAT',
        message: 'XNAT DICOM loader initialized successfully',
        type: 'success',
        duration: 2000,
      });
    }
  } catch (error) {
    console.error('XNAT: Error initializing XNAT DICOM loader:', error);
    
    // Show an error notification if the UI service is available
    if (uiNotificationService) {
      uiNotificationService.show({
        title: 'XNAT Error',
        message: `Error initializing XNAT DICOM loader: ${error.message || 'Unknown error'}`,
        type: 'error',
      });
    }
  }
}

// Declare cornerstone types for TypeScript
declare global {
  interface Window {
    cornerstone?: any;
    cornerstoneWADOImageLoader?: {
      wadors: {
        getConfiguration: () => any;
      };
      wadouri: {
        getConfiguration: () => any;
      };
      configure: (options: any) => void;
    };
  }
} 