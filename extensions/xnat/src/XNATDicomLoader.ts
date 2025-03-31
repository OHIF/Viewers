import { eventTarget, init as cornerstoneInit, imageLoader } from '@cornerstonejs/core';
import { volumeLoader } from '@cornerstonejs/core';
import { DicomMetadataStore, classes } from '@ohif/core';
import * as cornerstone from '@cornerstonejs/core';

// Define a type for cornerstoneWADOImageLoader since the module might not have type declarations
declare const cornerstoneWADOImageLoader: any;

// Get metadata provider
const metadataProvider = classes.MetadataProvider;

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
      
      // Log available image loaders for debugging
      console.info('XNAT: Available global objects:', {
        cornerstone: typeof cornerstone !== 'undefined',
        cornerstoneWADOImageLoader: typeof cornerstoneWADOImageLoader !== 'undefined',
        imageLoader: typeof imageLoader !== 'undefined'
      });
      
      // Check different places where the WADO image loader might be available
      let imageLoaderModule = null;
      
      // Try the global variable first
      if (typeof cornerstoneWADOImageLoader !== 'undefined') {
        console.info('XNAT: Found cornerstoneWADOImageLoader in global scope');
        imageLoaderModule = cornerstoneWADOImageLoader;
      }
      // Check window object next
      else if (typeof window !== 'undefined' && (window as any).cornerstoneWADOImageLoader) {
        console.info('XNAT: Found cornerstoneWADOImageLoader in window object');
        imageLoaderModule = (window as any).cornerstoneWADOImageLoader;
      }
      // Check if Cornerstone internal components are available
      else if (cornerstone) {
        console.info('XNAT: Checking for Cornerstone internal components');
        
        // In OHIF v3, there are no wadouri or wadors in the core package
        // We'll need to look for the WADO loaders in other places
        
        // Create a placeholder object that will be populated if we find the WADO loaders
        imageLoaderModule = {};
        
        // Check for dicomImageLoader in the cornerstonejs namespace on window
        if (typeof window !== 'undefined' && 
            (window as any).cornerstonejs && 
            (window as any).cornerstonejs.dicomImageLoader) {
          console.info('XNAT: Found WADO loader in cornerstonejs.dicomImageLoader');
          imageLoaderModule = (window as any).cornerstonejs.dicomImageLoader;
        }
      }
      
      // If we still don't have an image loader, try to dynamically import it
      if (!imageLoaderModule || (!imageLoaderModule.wadouri && !imageLoaderModule.wadors)) {
        console.warn('XNAT: Could not find WADO image loader in standard locations, will reject');
        
        // Only register a simple error handler that rejects all requests
        if (imageLoader && imageLoader.registerImageLoader) {
          // Create a simple function that just returns a rejected promise
          const failLoaderFunction = (imageId: string) => {
            console.error('XNAT: WADO loader not available for', imageId);
            
            return {
              promise: Promise.reject(new Error('WADO image loader not available')),
              cancelFn: () => console.log('XNAT: Cancelled image loading for', imageId)
            };
          };
          
          // Register our simplified error function
          imageLoader.registerImageLoader('dicomweb', failLoaderFunction);
          console.info('XNAT: Registered simple error handler for dicomweb loader');
        }
        
        // Dispatch an event to signal that WADO loader is missing
        const fallbackEvent = new CustomEvent('xnatdicomloaderfailed', {
          detail: {
            message: 'XNAT DICOM Loader failed - WADO image loader not available',
          }
        });
        document.dispatchEvent(fallbackEvent);
        
        // Reject the promise since we can't provide a functional loader
        reject(new Error('WADO image loader not available'));
        return;
      }
      
      // Log what image loaders are available
      console.info('XNAT: Available image loaders:', {
        wadouri: !!imageLoaderModule.wadouri,
        wadors: !!imageLoaderModule.wadors
      });
      
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
      
      // Reset the image loader providers to ensure clean configuration
      if (imageLoaderModule.resetImageLoaderProviders) {
        console.info('XNAT: Resetting image loader providers');
        imageLoaderModule.resetImageLoaderProviders();
      }

      // Configure WADO URI loader with authentication headers
      if (wadoUriLoader && wadoUriLoader.configure) {
        console.info('XNAT: Configuring WADO URI loader');
        wadoUriLoader.configure({
          beforeSend: (xhr: XMLHttpRequest, imageId: string) => {
            // Log the imageId for debugging
            console.info('XNAT: Loading image with ID:', imageId);
            
            // Add custom credentials for local XNAT server
            xhr.withCredentials = true;
            
            // Set accept header to allow any content type
            xhr.setRequestHeader('Accept', 'application/dicom;q=1,*/*');
            
            // Parse the imageId to handle dicomweb: prefix correctly
            if (imageId.startsWith('dicomweb:')) {
              console.info('XNAT: Processing dicomweb: imageId');
              
              // Get the actual URL part after the dicomweb: prefix
              const urlPart = imageId.substring('dicomweb:'.length);
              
              // Check if urlPart is already absolute - starts with http/https
              if (!urlPart.startsWith('http://') && !urlPart.startsWith('https://')) {
                // For relative URLs, prefix with wadoUriRoot from config
                const baseUrl = xnatConfig.wadoUriRoot || 'http://localhost';
                const fullUrl = new URL(urlPart.startsWith('/') ? urlPart : `/${urlPart}`, baseUrl).href;
                console.info('XNAT: Modified URL:', fullUrl);
                
                // Override the default URL with our correctly formed URL
                xhr.open('GET', fullUrl);
                
                // Also make sure we link this imageId to metadata
                try {
                  // Find matching instance in DicomMetadataStore by URL or filename
                  const matchingInstance = findMatchingInstanceForImageId(imageId, urlPart);
                  if (matchingInstance) {
                    // Ensure this instance is in the metadataProvider for Cornerstone
                    registerInstanceWithCornerstoneMetadataProvider(imageId, matchingInstance);
                  }
                } catch (e) {
                  console.warn('XNAT: Error linking metadata for imageId:', e);
                }
                
                return false; // Prevent default open
              }
            }
            
            return true; // Use default behavior for other cases
          },
          
          // Add custom headers to all requests
          requestHeaders: {
            ...xnatAuthHeaders,
            'Accept': 'application/dicom;q=1,*/*'
          }
        });
      }
      
      // Configure WADO RS loader if available
      const wadoRsLoader = imageLoaderModule.wadors;
      if (wadoRsLoader && wadoRsLoader.configure) {
        console.info('XNAT: Configuring WADO RS loader');
        wadoRsLoader.configure({
          beforeSend: (xhr: XMLHttpRequest, imageId: string) => {
            // Log the imageId for debugging
            console.info('XNAT: wadors loading image with ID:', imageId);
            
            // Add custom credentials for local XNAT server
            xhr.withCredentials = true;
            
            // Set accept header to allow any content type
            xhr.setRequestHeader('Accept', 'application/dicom;q=1,*/*');
            
            return true;
          },
          requestHeaders: {
            ...xnatAuthHeaders,
            'Accept': 'application/dicom;q=1,*/*'
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
        
        // First register the wadouri loader for dicomweb: prefix
        if (wadoUriLoader && wadoUriLoader.loadImage) {
          imageLoader.registerImageLoader('dicomweb', wadoUriLoader.loadImage);
          console.info('XNAT: Successfully registered dicomweb image loader');
          
          // Also register it for normal wadouri: prefix as a fallback
          imageLoader.registerImageLoader('wadouri', wadoUriLoader.loadImage);
          console.info('XNAT: Successfully registered wadouri image loader');
        } else if (wadoRsLoader && wadoRsLoader.loadImage) {
          console.info('XNAT: Using fallback to wadors loader');
          imageLoader.registerImageLoader('dicomweb', wadoRsLoader.loadImage);
        } else {
          console.warn('XNAT: Unable to register any DICOM loader - image loading may fail');
        }
      }
      
      // Register additional loaders if specified in config
      if (xnatConfig.dicomFileLoadSettings && xnatConfig.dicomFileLoadSettings.directLoad) {
        console.info('XNAT: Enabling direct file loading for DICOM files');
        
        if (typeof cornerstone !== 'undefined' && 
            typeof cornerstone.registerImageLoader === 'function') {
          // Register a direct http/https image loader to handle direct URLs if needed
          try {
            cornerstone.registerImageLoader('http', wadoUriLoader.loadImage);
            cornerstone.registerImageLoader('https', wadoUriLoader.loadImage);
            console.info('XNAT: Registered direct http/https image loaders');
          } catch (e) {
            console.warn('XNAT: Failed to register direct http/https loaders:', e);
          }
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

/**
 * Find matching instance in DicomMetadataStore based on imageId or URL path
 */
function findMatchingInstanceForImageId(imageId: string, urlPath: string): any {
  // Extract filename or path components from imageId
  let filename = '';
  try {
    const pathParts = urlPath.split('/');
    filename = pathParts[pathParts.length - 1];
    console.info('XNAT: Looking for metadata match for filename:', filename);
  } catch (e) {
    console.warn('XNAT: Error extracting filename from URL:', e);
  }
  
  // Try to find matching instance in DicomMetadataStore
  try {
    // Get all StudyInstanceUIDs from DicomMetadataStore
    const studyUIDs = DicomMetadataStore.getStudyInstanceUIDs();
    
    for (const studyUID of studyUIDs) {
      if (!studyUID) continue;
      
      // Get the study metadata
      const study = DicomMetadataStore.getStudy(studyUID);
      if (!study) continue;
      
      // Iterate through each series in the study
      for (const series of (study.series || [])) {
        if (!series || !series.SeriesInstanceUID) continue;
        
        // Get all instances for this series
        const seriesData = DicomMetadataStore.getSeries(
          studyUID, 
          series.SeriesInstanceUID
        );
        
        if (!seriesData || !seriesData.instances || !seriesData.instances.length) continue;
        
        // Look for instance with matching URL or filename
        for (const instance of seriesData.instances) {
          // Check if instance URL contains the filename
          if (instance.url && (instance.url.includes(filename) || instance.url === urlPath)) {
            console.info('XNAT: Found matching instance by URL for:', imageId);
            return instance;
          }
          
          // Check if instance filename matches
          if (instance.name === filename) {
            console.info('XNAT: Found matching instance by filename for:', imageId);
            return instance;
          }
        }
      }
    }
  } catch (e) {
    console.warn('XNAT: Error searching for matching instance:', e);
  }
  
  console.warn('XNAT: No matching instance found for:', imageId);
  return null;
}

/**
 * Register an instance with the Cornerstone metadata provider
 */
function registerInstanceWithCornerstoneMetadataProvider(imageId: string, instance: any): void {
  if (!instance) return;
  
  try {
    console.info('XNAT: Registering metadata for imageId:', imageId);
    
    // Detect which metadata provider is available
    const provider = metadataProvider || (window as any).cornerstone?.metaData;
    
    if (provider && typeof provider.addInstance === 'function') {
      // Use OHIF's MetadataProvider
      provider.addInstance(instance);
      console.info('XNAT: Added metadata to OHIF metadataProvider');
    } else if (provider && typeof provider.add === 'function') {
      // Use Cornerstone's direct metadata provider
      // Add each important DICOM tag to the metadata provider
      Object.entries(instance).forEach(([key, value]) => {
        if (key !== 'imageId' && value !== undefined) {
          provider.add(key, imageId, value);
        }
      });
      console.info('XNAT: Added metadata to Cornerstone metadataProvider');
    } else {
      console.warn('XNAT: No metadata provider available');
    }
  } catch (e) {
    console.warn('XNAT: Error registering metadata:', e);
  }
} 