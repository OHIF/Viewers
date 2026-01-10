import getStudies from './studiesList';
import { DicomMetadataStore, log, utils, Enums } from '@ohif/core';
import isSeriesFilterUsed from '../../utils/isSeriesFilterUsed';

const { getSplitParam } = utils;

/**
 * Initialize the route.
 *
 * @param props.servicesManager to read services from
 * @param props.studyInstanceUIDs for a list of studies to read
 * @param props.dataSource to read the data from
 * @param props.filters filters from query params to read the data from
 * @returns array of subscriptions to cancel
 */
export async function defaultRouteInit(
  { servicesManager, studyInstanceUIDs, dataSource, filters, appConfig }: withAppTypes,
  hangingProtocolId,
  stageIndex
) {
  const { displaySetService, hangingProtocolService, uiNotificationService, customizationService } =
    servicesManager.services;
  /**
   * Function to apply the hanging protocol when the minimum number of display sets were
   * received or all display sets retrieval were completed
   * @returns
   */
  function applyHangingProtocol() {
    const displaySets = displaySetService.getActiveDisplaySets();

    if (!displaySets || !displaySets.length) {
      return;
    }

    // Gets the studies list to use
    const studies = getStudies(studyInstanceUIDs, displaySets);

    // study being displayed, and is thus the "active" study.
    const activeStudy = studies[0];

    // run the hanging protocol matching on the displaySets with the predefined
    // hanging protocol in the mode configuration
    hangingProtocolService.run({ studies, activeStudy, displaySets }, hangingProtocolId, {
      stageIndex,
    });
  }

  const unsubscriptions = [];
  const issuedWarningSeries = [];
  const problematicSeries = new Set<string>();
  
  /**
   * Validates a series to detect if it's problematic (e.g., corrupted metadata)
   * Returns true if the series is valid, false if it should be skipped
   */
  const validateSeries = (instances: any[]): boolean => {
    if (!instances || !instances.length) {
      return false;
    }

    try {
      // Try to access essential metadata fields that are needed for display
      const firstInstance = instances[0];
      
      // Check for required UIDs
      if (!firstInstance.StudyInstanceUID || !firstInstance.SeriesInstanceUID) {
        return false;
      }

      // Check for "cal" in series description - calibration series often have invalid VR types
      // that cause "Invalid vr type W - using UN" errors
      try {
        const seriesDescription = (firstInstance.SeriesDescription || '').toLowerCase();
        if (seriesDescription.includes('cal')) {
          console.warn(`Rejecting calibration series (has invalid VR types): ${firstInstance.SeriesDescription}`, {
            SeriesInstanceUID: firstInstance.SeriesInstanceUID,
            SeriesDescription: firstInstance.SeriesDescription,
          });
          return false;
        }
      } catch (error) {
        // If we can't access SeriesDescription, it might be corrupted - skip it
        console.warn(`Cannot access SeriesDescription for series ${firstInstance.SeriesInstanceUID}:`, error);
        return false;
      }

      // Check if series was marked as problematic during parsing (e.g., invalid VR types)
      if (DicomMetadataStore.isSeriesProblematic(firstInstance.SeriesInstanceUID)) {
        const seriesDescription = firstInstance.SeriesDescription || 'Unknown';
        console.warn(`Rejecting series with invalid VR types detected during parsing: ${seriesDescription}`, {
          SeriesInstanceUID: firstInstance.SeriesInstanceUID,
          SeriesDescription: seriesDescription,
        });
        return false;
      }

      // Try to access common metadata fields that might throw errors
      // if the metadata is corrupted
      const testFields = [
        'SOPInstanceUID',
        'SOPClassUID',
        'Modality',
        'SeriesNumber',
        'SeriesDescription',
        'InstanceNumber',
      ];

      for (const field of testFields) {
        try {
          // Just accessing the field to see if it throws
          const value = firstInstance[field];
          // If it's an object with problematic structure, JSON.stringify might fail
          if (value !== null && value !== undefined && typeof value === 'object') {
            JSON.stringify(value);
          }
        } catch (error) {
          console.warn(`Problematic field "${field}" in series ${firstInstance.SeriesInstanceUID}:`, error);
          return false;
        }
      }

      // Try to process a few instances to see if metadata parsing works
      const instancesToTest = instances.slice(0, Math.min(3, instances.length));
      for (const instance of instancesToTest) {
        // Try accessing imageId if it exists (might trigger metadata loading)
        if (instance.imageId) {
          try {
            // Just check if we can access basic properties without errors
            const testAccess = instance.Rows || instance.Columns || instance.Modality;
          } catch (error) {
            console.warn(`Error accessing instance metadata in series ${firstInstance.SeriesInstanceUID}:`, error);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.warn(`Error validating series ${instances[0]?.SeriesInstanceUID}:`, error);
      return false;
    }
  };

  const { unsubscribe: instanceAddedUnsubscribe } = DicomMetadataStore.subscribe(
    DicomMetadataStore.EVENTS.INSTANCES_ADDED,
    function ({ StudyInstanceUID, SeriesInstanceUID, madeInClient = false }) {
      const seriesMetadata = DicomMetadataStore.getSeries(StudyInstanceUID, SeriesInstanceUID);

      if (!seriesMetadata || !seriesMetadata.instances) {
        console.warn(`No instances found for series ${SeriesInstanceUID}`);
        return;
      }

      // Validate series before processing - skip problematic ones
      if (!validateSeries(seriesMetadata.instances)) {
        const seriesKey = `${StudyInstanceUID}_${SeriesInstanceUID}`;
        if (!problematicSeries.has(seriesKey)) {
          problematicSeries.add(seriesKey);
          const seriesDesc = seriesMetadata.instances[0]?.SeriesDescription || SeriesInstanceUID;
          const hasInvalidVRTypes = DicomMetadataStore.isSeriesProblematic(SeriesInstanceUID);
          console.warn(`Skipping problematic series: ${SeriesInstanceUID}`, {
            StudyInstanceUID,
            SeriesInstanceUID,
            instanceCount: seriesMetadata.instances?.length,
            SeriesDescription: seriesDesc,
            hasInvalidVRTypes,
          });
          uiNotificationService.show({
            title: 'Series Skipped',
            message: hasInvalidVRTypes
              ? `Series "${seriesDesc}" was skipped due to invalid DICOM metadata (invalid VR types detected during parsing).`
              : `Series "${seriesDesc}" could not be loaded and was skipped.`,
            type: 'warning',
            duration: 5000,
          });
        }
        return; // Skip creating display sets for this series
      }

      // checks if the series filter was used, if it exists
      const seriesInstanceUIDs = filters?.seriesInstanceUID;
      if (
        seriesInstanceUIDs?.length &&
        !isSeriesFilterUsed(seriesMetadata.instances, filters) &&
        !issuedWarningSeries.includes(seriesInstanceUIDs[0])
      ) {
        // stores the series instance filter so it shows only once the warning
        issuedWarningSeries.push(seriesInstanceUIDs[0]);
        uiNotificationService.show({
          title: 'Series filter',
          message: `Each of the series in filter: ${seriesInstanceUIDs} are not part of the current study. The entire study is being displayed`,
          type: 'error',
          duration: 7000,
        });
      }

      // Try to create display sets, but catch any errors and mark series as problematic
      try {
        displaySetService.makeDisplaySets(seriesMetadata.instances, { madeInClient });
      } catch (error) {
        const seriesKey = `${StudyInstanceUID}_${SeriesInstanceUID}`;
        if (!problematicSeries.has(seriesKey)) {
          problematicSeries.add(seriesKey);
          console.error(`Error creating display sets for series ${SeriesInstanceUID}:`, error);
          uiNotificationService.show({
            title: 'Series Error',
            message: `Series "${seriesMetadata.instances[0]?.SeriesDescription || SeriesInstanceUID}" encountered an error and was skipped.`,
            type: 'error',
            duration: 5000,
          });
        }
      }
    }
  );

  unsubscriptions.push(instanceAddedUnsubscribe);

  log.time(Enums.TimingEnum.STUDY_TO_DISPLAY_SETS);
  log.time(Enums.TimingEnum.STUDY_TO_FIRST_IMAGE);

  const allRetrieves = studyInstanceUIDs.map(StudyInstanceUID =>
    dataSource.retrieve.series.metadata({
      StudyInstanceUID,
      filters,
      returnPromises: true,
      sortCriteria: customizationService.getCustomization('sortingCriteria'),
    })
  );

  // log the error if this fails, otherwise it's so difficult to tell what went wrong...
  allRetrieves.forEach(retrieve => {
    retrieve.catch(error => {
      console.error(error);
    });
  });

  // is displaysets from URL and has initialSOPInstanceUID or initialSeriesInstanceUID
  // then we need to wait for all display sets to be retrieved before applying the hanging protocol
  const params = new URLSearchParams(window.location.search);

  const initialSeriesInstanceUID = getSplitParam('initialseriesinstanceuid', params);
  const initialSOPInstanceUID = getSplitParam('initialsopinstanceuid', params);

  let displaySetFromUrl = false;
  if (initialSeriesInstanceUID || initialSOPInstanceUID) {
    displaySetFromUrl = true;
  }

  await Promise.allSettled(allRetrieves).then(async promises => {
    log.timeEnd(Enums.TimingEnum.STUDY_TO_DISPLAY_SETS);
    log.time(Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE);
    log.time(Enums.TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES);

    const allPromises = [];
    const remainingPromises = [];

    function startRemainingPromises(remainingPromises) {
      remainingPromises.forEach(p => p.forEach(p => p.start()));
    }

    promises.forEach(promise => {
      const retrieveSeriesMetadataPromise = promise.value;
      if (!Array.isArray(retrieveSeriesMetadataPromise)) {
        return;
      }

      if (displaySetFromUrl) {
        const requiredSeriesPromises = retrieveSeriesMetadataPromise.map(promise =>
          promise.start()
        );
        allPromises.push(Promise.allSettled(requiredSeriesPromises));
      } else {
        const { requiredSeries, remaining } = hangingProtocolService.filterSeriesRequiredForRun(
          hangingProtocolId,
          retrieveSeriesMetadataPromise
        );
        const requiredSeriesPromises = requiredSeries.map(promise => promise.start());
        allPromises.push(Promise.allSettled(requiredSeriesPromises));
        remainingPromises.push(remaining);
      }
    });

    await Promise.allSettled(allPromises).then(applyHangingProtocol);
    startRemainingPromises(remainingPromises);
    applyHangingProtocol();
  });

  return unsubscriptions;
}
