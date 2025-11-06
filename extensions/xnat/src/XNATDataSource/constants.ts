// Define the logger
export const log = {
    debug: (message: string, ...args: any[]) => {
        console.debug(`XNATDataSource: ${message}`, ...args);
    },
    info: (message: string, ...args: any[]) => {
        console.info(`XNATDataSource: ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        console.warn(`XNATDataSource: ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
        console.error(`XNATDataSource: ${message}`, ...args);
    }
};

/**
 * Determines the appropriate image loader scheme based on the provided DICOM URL.
 * @param url - The URL to the DICOM file or DICOMweb endpoint
 * @param preferredScheme - The preferred scheme to use, defaults to 'wadouri'
 * @returns A properly formatted imageId string
 */
export const getAppropriateImageId = (url: string, preferredScheme = 'wadouri'): string => {
    if (!url) {
        log.warn('XNAT: Empty URL provided to getAppropriateImageId');
        return '';
    }
    // If URL already has a scheme, respect it
    if (url.includes(':') &&
        !url.startsWith('http://') &&
        !url.startsWith('https://') &&
        !url.startsWith('dicomweb:')) {
        return url;
    }

    // For HTTP(S) URLs, always use dicomweb: prefix
    if (url.startsWith('http://') || url.startsWith('https://')) {
        const imageId = `dicomweb:${url}`;
        return imageId;
    }

    // For relative URLs that don't have a scheme yet
    if (!url.includes(':')) {
        const imageId = `dicomweb:${url}`;
        return imageId;
    }

    // If already has dicomweb: prefix, return as is
    return url;
};

// DICOM Implementation constants
export const ImplementationClassUID = '2.25.270695996825855179949881587723571202391.2.0.0';
export const ImplementationVersionName = 'OHIF-VIEWER-2.0.0';
export const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';
