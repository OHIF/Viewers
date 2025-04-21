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
  console.info('XNAT: Initializing XNAT DICOM Loader Registration');

  return new Promise<void>((resolve, reject) => {
    // Define the configuration logic as a separate function
    const configureLoaders = () => {
      console.info('XNAT: Attempting to configure loaders...');
      try {
        // Check if Cornerstone is initialized
        const isCornerstoneInitialized = cornerstone && cornerstone.getEnabledElement;
        console.info('XNAT: Cornerstone initialization status:', isCornerstoneInitialized ? 'Initialized' : 'Not initialized');

        // Log available globals
        console.info('XNAT: Available global objects:', {
          cornerstone: typeof cornerstone !== 'undefined',
          cornerstoneWADOImageLoader: typeof cornerstoneWADOImageLoader !== 'undefined',
          imageLoader: typeof imageLoader !== 'undefined',
          windowCornerstoneWADO: typeof window !== 'undefined' && (window as any).cornerstoneWADOImageLoader,
          windowCornerstoneJS: typeof window !== 'undefined' && (window as any).cornerstonejs,
        });

        // Check different places where the WADO image loader might be available
        let imageLoaderModule = null;
        let isFallbackLoader = false; // Flag to track if we're using the fallback

        if (typeof cornerstoneWADOImageLoader !== 'undefined') {
          console.info('XNAT: Found cornerstoneWADOImageLoader in global scope');
          imageLoaderModule = cornerstoneWADOImageLoader;
        } else if (typeof window !== 'undefined' && (window as any).cornerstoneWADOImageLoader) {
          console.info('XNAT: Found cornerstoneWADOImageLoader in window object');
          imageLoaderModule = (window as any).cornerstoneWADOImageLoader;
        } else if (typeof window !== 'undefined' && (window as any).cornerstonejs && (window as any).cornerstonejs.dicomImageLoader) {
          console.info('XNAT: Found WADO loader in cornerstonejs.dicomImageLoader');
          imageLoaderModule = (window as any).cornerstonejs.dicomImageLoader;
        } else if (typeof cornerstone !== 'undefined' && cornerstone.imageLoader && cornerstone.imageLoader.loadImage) {
          // Fallback: Assume loaders were registered with cornerstone core's imageLoader
          console.warn('XNAT: cornerstoneWADOImageLoader not found globally. Assuming loaders registered via cornerstone.imageLoader.');
          // Create a minimal mock module structure pointing to the core loadImage function
          imageLoaderModule = {
            wadouri: { loadImage: cornerstone.imageLoader.loadImage },
            wadors: { loadImage: cornerstone.imageLoader.loadImage }, // Assume same loader handles both
            // Configuration and web workers likely unavailable in this fallback
            configure: () => { console.warn('XNAT: Configuration skipped (fallback loader).'); },
            webWorkerManager: { initialize: () => { console.warn('XNAT: Web worker init skipped (fallback loader).'); } },
            resetImageLoaderProviders: () => { console.warn('XNAT: Mock resetImageLoaderProviders called (fallback loader).'); }
          };
          isFallbackLoader = true;
        }

        // If we still don't have an image loader, reject
        if (!imageLoaderModule || (!imageLoaderModule.wadouri && !imageLoaderModule.wadors)) {
          console.error('XNAT: Could not find WADO image loader functions.');
          reject(new Error('WADO image loader functions not available'));
          return;
        }

        // Log what image loaders are available
        console.info('XNAT: Available image loaders functions:', {
          wadouriLoadImage: !!imageLoaderModule.wadouri?.loadImage,
          wadorsLoadImage: !!imageLoaderModule.wadors?.loadImage
        });

        // Configure the WADO URI loader
        const wadoUriLoader = imageLoaderModule.wadouri;

        // Add XNAT-specific auth headers
        const xnatAuthHeaders: Record<string, string> = {};
        if (xnatConfig?.xnatAuth?.token) {
          console.info('XNAT: Setting up XSRF token for image loading');
          xnatAuthHeaders['XNAT-XSRF-TOKEN'] = xnatConfig.xnatAuth.token;
        }
        if (xnatConfig?.xnatAuth?.jsessionid) {
          console.info('XNAT: Setting up JSESSIONID for image loading');
          document.cookie = `JSESSIONID=${xnatConfig.xnatAuth.jsessionid}; path=/`;
        }

        // Reset the image loader providers if not using fallback
        if (!isFallbackLoader && imageLoaderModule.resetImageLoaderProviders) {
          console.info('XNAT: Resetting image loader providers');
          imageLoaderModule.resetImageLoaderProviders();
        }

        // Configure WADO URI loader with authentication headers if possible
        if (!isFallbackLoader && wadoUriLoader && wadoUriLoader.configure) {
          console.info('XNAT: Configuring WADO URI loader');
          wadoUriLoader.configure({
            beforeSend: (xhr: XMLHttpRequest, imageId: string) => {
              console.info('XNAT: Loading image with ID:', imageId);
              xhr.withCredentials = true;
              xhr.setRequestHeader('Accept', 'application/dicom;q=1,*/*');
              if (imageId.startsWith('dicomweb:')) {
                console.info('XNAT: Processing dicomweb: imageId');
                const urlPart = imageId.substring('dicomweb:'.length);
                if (!urlPart.startsWith('http://') && !urlPart.startsWith('https://')) {
                  const baseUrl = xnatConfig.wadoUriRoot || 'http://localhost';
                  const fullUrl = new URL(urlPart.startsWith('/') ? urlPart : `/${urlPart}`, baseUrl).href;
                  console.info('XNAT: Modified URL:', fullUrl);
                  xhr.open('GET', fullUrl); // Overwrite the default open behavior
                  try {
                    const matchingInstance = findMatchingInstanceForImageId(imageId, urlPart);
                    if (matchingInstance) {
                      registerInstanceWithCornerstoneMetadataProvider(imageId, matchingInstance);
                    }
                  } catch (e) {
                    console.warn('XNAT: Error linking metadata for imageId:', e);
                  }
                  // Custom headers need to be set after open()
                  Object.entries(xnatAuthHeaders).forEach(([key, value]) => xhr.setRequestHeader(key, value));
                  // Note: Returning false might not be standard, ensure it works or handle appropriately
                  // Let's assume we let the default send happen after setting URL and headers
                  return true; 
                }
              } else {
                // For non-dicomweb or absolute URLs, just set headers
                 Object.entries(xnatAuthHeaders).forEach(([key, value]) => xhr.setRequestHeader(key, value));
              }
              return true; // Use default behavior for open/send
            },
            requestHeaders: { ...xnatAuthHeaders } // Keep this for potential internal use by the loader
          });
        } else if (isFallbackLoader) {
            console.warn('XNAT: Skipping WADO URI configuration (fallback loader).');
        }

        // Configure WADO RS loader if available and not using fallback
        const wadoRsLoader = imageLoaderModule.wadors;
        if (!isFallbackLoader && wadoRsLoader && wadoRsLoader.configure) {
          console.info('XNAT: Configuring WADO RS loader');
          wadoRsLoader.configure({
            beforeSend: (xhr: XMLHttpRequest, imageId: string) => {
              console.info('XNAT: wadors loading image with ID:', imageId);
              xhr.withCredentials = true;
              xhr.setRequestHeader('Accept', 'application/dicom;q=1,*/*');
              Object.entries(xnatAuthHeaders).forEach(([key, value]) => xhr.setRequestHeader(key, value));
              return true;
            },
            requestHeaders: { ...xnatAuthHeaders }
          });
        } else if (isFallbackLoader) {
           console.warn('XNAT: Skipping WADO RS configuration (fallback loader).');
        }

        // Set cornerstone to use web workers if available and not using fallback
        if (!isFallbackLoader && imageLoaderModule.webWorkerManager && imageLoaderModule.webWorkerManager.initialize) {
          console.info('XNAT: Initializing web worker manager');
          try {
             imageLoaderModule.webWorkerManager.initialize({
               maxWebWorkers: Math.max(navigator.hardwareConcurrency || 2, 2),
               startWebWorkersOnDemand: true,
             });
          } catch (workerError) {
             console.warn('XNAT: Failed to initialize web worker manager:', workerError);
          }
        } else if (isFallbackLoader) {
           console.warn('XNAT: Skipping web worker initialization (fallback loader).');
        }

        // Register the dicomweb image loader (used by our modified imageId format)
        if (imageLoader && imageLoader.registerImageLoader) {
          console.info('XNAT: Attempting to register dicomweb image loader...');
          // Prefer wadouri.loadImage if available, otherwise try wadors.loadImage
          const loaderFn = wadoUriLoader?.loadImage || wadoRsLoader?.loadImage;

          if (loaderFn) {
            try {
              // imageLoader.registerImageLoader('dicomweb', loaderFn);
              // console.info('XNAT: Successfully registered dicomweb image loader.');
              // Also register for wadouri scheme explicitly if using wadouri loader
              if (wadoUriLoader?.loadImage === loaderFn) {
                 imageLoader.registerImageLoader('wadouri', loaderFn);
                 console.info('XNAT: Successfully registered wadouri image loader.');
              }
            } catch (registrationError) {
               console.error('XNAT: Error registering dicomweb/wadouri loader:', registrationError);
               reject(new Error('Failed to register dicomweb/wadouri loader'));
               return;
            }
          } else {
            console.error('XNAT: Unable to find a suitable loadImage function to register for dicomweb.');
            reject(new Error('No WADO URI or RS loadImage function found'));
            return;
          }
        } else {
           console.error('XNAT: cornerstone.imageLoader.registerImageLoader is not available.');
           reject(new Error('imageLoader.registerImageLoader not available'));
           return;
        }

        // Register additional loaders if specified in config
        if (xnatConfig.dicomFileLoadSettings && xnatConfig.dicomFileLoadSettings.directLoad) {
          console.info('XNAT: Enabling direct file loading for DICOM files');
          if (typeof cornerstone !== 'undefined' && imageLoader && imageLoader.registerImageLoader) {
             try {
                const loaderFn = wadoUriLoader?.loadImage || wadoRsLoader?.loadImage;
                if (loaderFn) {
                  imageLoader.registerImageLoader('http', loaderFn);
                  imageLoader.registerImageLoader('https', loaderFn);
                  console.info('XNAT: Registered direct http/https image loaders');
                } else {
                   console.warn('XNAT: Could not find loader function for http/https registration');
                }
             } catch (e) {
                console.warn('XNAT: Failed to register direct http/https loaders:', e);
             }
          }
        }

        // Dispatching a custom event to signal that XNAT DICOM loader is ready
        console.info('XNAT: DICOM Loader configuration complete.');
        const customEvent = new CustomEvent('xnatdicomloaderconfigured', {
          detail: {
            message: 'XNAT DICOM Loader Configured',
          }
        });
        document.dispatchEvent(customEvent);

        // Successfully resolve the main promise
        resolve();

      } catch (error) {
        console.error('XNAT: Error during loader configuration:', error);
        reject(error); // Reject the main promise on error
      }
    };

    // Configure loaders immediately after the current execution context.
    // This assumes Cornerstone core is initialized by this time.
    console.info('XNAT: Scheduling immediate loader configuration.');
    setTimeout(configureLoaders, 0);
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
        console.log('XNAT SOP DEBUG: seriesData.instances:', seriesData.instances);
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