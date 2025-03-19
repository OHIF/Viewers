import { eventTarget, init as cornerstoneInit } from '@cornerstonejs/core';
import { volumeLoader, imageLoader } from '@cornerstonejs/core';
import { DicomMetadataStore } from '@ohif/core';
import * as cornerstone from '@cornerstonejs/core';

// Define a type for cornerstoneWADOImageLoader since the module might not have type declarations
declare const cornerstoneWADOImageLoader: any;

/**
 * Initialize the XNAT DICOM loader
 * This sets up the cornerstone WADO image loaders to work with XNAT URLs
 */
export function initXNATDicomLoader(xnatConfig: any): Promise<void> {
  // Make sure we're returning a standard promise that doesn't have custom methods
  // that might be incompatible with the OHIF initialization system
  console.info('XNAT: Initializing XNAT DICOM Loader');
  
  // This is a standard promise that will resolve when initialization is complete
  return new Promise<void>((resolve, reject) => {
    try {
      // Check if Cornerstone is already initialized
      const isCornerstoneInitialized = cornerstone && cornerstone.getEnabledElement;
      console.info('XNAT: Cornerstone initialization status:', isCornerstoneInitialized ? 'Initialized' : 'Not initialized');
      
      // Check if cornerstoneWADOImageLoader is available in the global scope
      const imageLoaderModule = 
        typeof cornerstoneWADOImageLoader !== 'undefined' 
          ? cornerstoneWADOImageLoader 
          : (window as any).cornerstoneWADOImageLoader;
      
      if (!imageLoaderModule) {
        console.warn('XNAT: WADO image loader not available - cannot configure');
        reject(new Error('WADO image loader not available'));
        return;
      }
      
      // Configure the DICOM loader regardless of cornerstone initialization status
      // This ensures we set up the loaders even if cornerstone is loaded later
      
      // Configure the WADO URI loader
      const wadoUriLoader = imageLoaderModule.wadouri;
      
      // Add XNAT-specific auth headers
      const xnatAuthHeaders: Record<string, string> = {};
      
      // Add XSRF token if available from xnatConfig
      if (xnatConfig?.xnatAuth?.token) {
        console.info('XNAT: Setting up XSRF token for image loading');
        xnatAuthHeaders['XNAT-XSRF-TOKEN'] = xnatConfig.xnatAuth.token;
      }
      
      // Add JSESSIONID cookie if needed for authentication
      if (xnatConfig?.xnatAuth?.jsessionid) {
        console.info('XNAT: Setting up JSESSIONID for image loading');
        document.cookie = `JSESSIONID=${xnatConfig.xnatAuth.jsessionid}; path=/`;
      }
      
      // Configure WADO URI loader with authentication headers
      const wadoUriConfig = {
        callback: (options: any) => {
          const newOptions = { ...options };
          
          // Add auth headers to the request
          newOptions.requestHeaders = {
            ...newOptions.requestHeaders,
            ...xnatAuthHeaders
          };
          
          return newOptions;
        }
      };
      
      // Configure the WADO loaders
      if (wadoUriLoader && wadoUriLoader.configure) {
        console.info('XNAT: Configuring WADO URI loader');
        wadoUriLoader.configure({
          ...wadoUriConfig,
          // Add configuration related to URL handling
          beforeSend: (xhr: XMLHttpRequest, imageId: string) => {
            // Log the imageId for debugging
            console.info('XNAT: Loading image with ID:', imageId);
            
            // Make XNAT server URLs work correctly
            if (xnatConfig.wadoUriRoot && imageId.includes('dicomweb:')) {
              console.info('XNAT: Using wadoUriRoot from config:', xnatConfig.wadoUriRoot);
              
              // If imageId has a relative path after dicomweb:, we need to prepend the correct root
              if (imageId.startsWith('dicomweb:') && !imageId.startsWith('dicomweb:http')) {
                const path = imageId.substring('dicomweb:'.length);
                const correctUrl = new URL(path, xnatConfig.wadoUriRoot).href;
                console.info('XNAT: Corrected URL for relative path:', correctUrl);
                xhr.open('GET', correctUrl);
                return false; // Prevent the default open() call
              }
            }
            
            // Add credentials to the request
            xhr.withCredentials = true;
            
            // Default behavior (let cornerstone handle it)
            return true;
          }
        });
      }
      
      // Configure WADO RS loader if available
      const wadoRsLoader = imageLoaderModule.wadors;
      if (wadoRsLoader && wadoRsLoader.configure) {
        console.info('XNAT: Configuring WADO RS loader');
        wadoRsLoader.configure({
          callback: (options: any) => {
            const newOptions = { ...options };
            newOptions.requestHeaders = {
              ...newOptions.requestHeaders,
              ...xnatAuthHeaders
            };
            return newOptions;
          }
        });
      }
      
      // Set cornerstone to use web workers if available
      if (imageLoaderModule.webWorkerManager) {
        console.info('XNAT: Initializing web worker manager');
        imageLoaderModule.webWorkerManager.initialize({
          maxWebWorkers: Math.max(navigator.hardwareConcurrency || 2, 2),
          startWebWorkersOnDemand: true,
        });
      }
      
      // Register the dicomweb image loader (used by our modified imageId format)
      if (imageLoader && imageLoader.registerImageLoader) {
        console.info('XNAT: Registering dicomweb image loader');
        
        // First make sure the loader is available
        if (wadoUriLoader && wadoUriLoader.loadImage) {
          imageLoader.registerImageLoader('dicomweb', wadoUriLoader.loadImage);
          console.info('XNAT: Successfully registered dicomweb image loader');
        } else if (wadoRsLoader && wadoRsLoader.loadImage) {
          console.info('XNAT: Using fallback to wadors loader');
          imageLoader.registerImageLoader('dicomweb', wadoRsLoader.loadImage);
        } else {
          console.warn('XNAT: Unable to register any DICOM loader - image loading may fail');
        }
      }
      
      // Set up debugging event listeners
      document.addEventListener('cornerstoneimageloaded', (event: any) => {
        console.info('XNAT: Cornerstone image loaded event', event.detail);
      });
      
      document.addEventListener('cornerstoneimageloadfailed', (event: any) => {
        console.error('XNAT: Cornerstone image load failed event', event.detail);
      });
      
      document.addEventListener('cornerstoneimagerendered', (event: any) => {
        console.debug('XNAT: Cornerstone image rendered event', event.detail?.viewportId);
      });
      
      // Set up a timeout to handle cases where Cornerstone might not initialize
      const initTimeout = setTimeout(() => {
        console.warn('XNAT: Cornerstone initialization timeout after 5 seconds');
        const timeoutEvent = new CustomEvent('xnatdicomloadertimeout', {
          detail: {
            message: 'XNAT DICOM Loader initialization timed out',
          }
        });
        document.dispatchEvent(timeoutEvent);
        
        // Still resolve the promise since the loaders were registered
        resolve();
      }, 5000);
      
      // Dispatching a custom event to signal that XNAT DICOM loader is ready
      console.info('XNAT: DICOM Loader initialization complete');
      const customEvent = new CustomEvent('xnatdicomloaderinitialized', {
        detail: {
          message: 'XNAT DICOM Loader Initialized',
        }
      });
      document.dispatchEvent(customEvent);
      
      // Clear the timeout since we're successfully initialized
      clearTimeout(initTimeout);
      
      // Successfully resolve the promise
      resolve();
    } catch (error) {
      console.error('XNAT: Error configuring DICOM loader:', error);
      // Reject with the error
      reject(error);
    }
  });
} 