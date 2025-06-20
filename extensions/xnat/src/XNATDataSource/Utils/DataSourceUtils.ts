import { XNATDataSourceConfig } from '../index';
import { DicomMetadataStore } from '@ohif/core';

const log = {
  debug: (message: string, ...args: any[]) => {
    console.debug(`XNATDataSourceUtils: ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.info(`XNATDataSourceUtils: ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`XNATDataSourceUtils: ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`XNATDataSourceUtils: ${message}`, ...args);
  }
};

/**
 * Placeholder function to convert relative URLs to absolute URLs.
 * Implement the actual logic based on your XNAT setup and configuration.
 */
export function convertToAbsoluteUrl(relativePath: string, baseUrl: string, config?: XNATDataSourceConfig): string {

  // Simple check: If the path already starts with http, assume it's absolute
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    let newUrl = relativePath;
    if (baseUrl.startsWith('https://') && newUrl.startsWith('http://')) {
      newUrl = newUrl.replace('http://', 'https://');
    }
    return newUrl;
  }

  // Remove leading/trailing slashes for consistent joining
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanRelative = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

  // Basic joining
  const absoluteUrl = `${cleanBase}/${cleanRelative}`;
  return absoluteUrl;
}

/**
 * Placeholder function to extract XNAT project and experiment IDs from a study instance UID.
 * Implement the actual logic based on how your StudyInstanceUIDs correlate to XNAT entities.
 */
export function getXNATStatusFromStudyInstanceUID(studyInstanceUID: string, config: XNATDataSourceConfig): { projectId?: string; experimentId?: string } {
  log.debug('Getting XNAT status from StudyInstanceUID:', studyInstanceUID);

  // Example placeholder logic: Assumes StudyInstanceUID might *be* the experiment ID
  // and relies on the projectId being in the config.
  // **REPLACE THIS WITH YOUR ACTUAL LOGIC**
  const projectId = config?.xnat?.projectId;
  let experimentId = config?.xnat?.experimentId;

  // If experimentId is not in config, maybe the studyInstanceUID is the experimentId?
  if (!experimentId && studyInstanceUID) {
     experimentId = studyInstanceUID; // Common pattern, but needs verification
     log.warn(`Assuming StudyInstanceUID '${studyInstanceUID}' is the ExperimentID.`);
  }

  if (!projectId) {
    log.error('Project ID is missing in configuration.');
    // Potentially throw an error or return empty object depending on requirements
  }

  log.debug('Derived XNAT identifiers:', { projectId, experimentId });
  return { projectId, experimentId };
}

/**
 * Placeholder function to fetch and process instance metadata from the XNAT API for series.
 * Implement the actual fetching and processing logic.
 */
export async function getSeriesXNATInstancesMetadata(params: {
  projectId?: string;
  experimentId?: string;
  seriesUID?: string; // Specify which series, or undefined for all
  implementation: any; // Pass the datasource implementation to call xnat.getExperimentMetadata
}): Promise<any[]> {
  const { projectId, experimentId, seriesUID, implementation } = params;
  log.debug('Fetching series instance metadata from XNAT:', params);

  if (!projectId || !experimentId) {
    log.error('Missing projectId or experimentId for getSeriesXNATInstancesMetadata');
    return [];
  }

  try {
    // Use the implementation passed in to call the XNAT API method
    const experimentMetadata = await implementation.xnat.getExperimentMetadata(projectId, experimentId);

    if (!experimentMetadata || !experimentMetadata.studies || experimentMetadata.studies.length === 0) {
      log.warn('No experiment metadata found or no studies within.');
      return [];
    }

    let allSeries: any[] = [];
    experimentMetadata.studies.forEach(study => {
      if (study.series && study.series.length > 0) {
        // Add study context to each series
        const seriesWithContext = study.series.map(s => ({ ...s, StudyInstanceUID: study.StudyInstanceUID }));
        allSeries = allSeries.concat(seriesWithContext);
      }
    });


    // If a specific seriesUID is requested, filter for it
    if (seriesUID) {
      const specificSeries = allSeries.filter(s => s.SeriesInstanceUID === seriesUID);
      log.debug(`Filtered for SeriesInstanceUID ${seriesUID}, found ${specificSeries.length} matches.`);
      return specificSeries;
    }

    // Otherwise, return all series data
    return allSeries;
  } catch (error) {
    log.error('Error fetching or processing series instance metadata:', error);
    return []; // Return empty array on error
  }
}

/**
 * Placeholder function for setting up display set logging.
 * Implement any specific logging setup needed for display sets.
 */
export function setupDisplaySetLogging(): void {
  log.info('Setting up display set logging...');
  // Placeholder: Add any specific logic here, e.g., configuring listeners or log levels.
  // Example: could listen to DicomMetadataStore events
  // DicomMetadataStore.subscribe(DicomMetadataStore.EVENTS.INSTANCES_ADDED, (data) => {
  //   log.debug('Instances added:', data);
  // });
} 