import { DicomMetadataStore, log, utils, Enums } from '@ohif/core';
import getStudies from './studiesList';
import isSeriesFilterUsed from '../../utils/isSeriesFilterUsed';

const { getSplitParam } = utils;

/**
 * Gets all studies for a patient by MRN from the first study.
 */
async function getStudiesForPatientByMRN(dataSource, qidoForStudyUID) {
  const mrn = qidoForStudyUID[0]?.mrn;
  if (!mrn) {
    return qidoForStudyUID;
  }

  return dataSource.query.studies.search({ patientId: mrn, disableWildcard: true });
}

function normalizeModalities(modalities) {
  if (Array.isArray(modalities)) {
    return modalities.filter(Boolean);
  }

  if (typeof modalities === 'string') {
    return modalities.split('\\').filter(Boolean);
  }

  return [];
}

function upsertStudyMetadata(studyMetadata) {
  const existingStudy = DicomMetadataStore.getStudy(studyMetadata.StudyInstanceUID);

  if (!existingStudy) {
    DicomMetadataStore.addStudy(studyMetadata);
    return;
  }

  const mergedModalities = Array.from(
    new Set([
      ...normalizeModalities(existingStudy.ModalitiesInStudy),
      ...normalizeModalities(studyMetadata.ModalitiesInStudy),
    ])
  );

  Object.assign(existingStudy, {
    PatientID: studyMetadata.PatientID ?? existingStudy.PatientID,
    PatientName: studyMetadata.PatientName ?? existingStudy.PatientName,
    StudyDate: studyMetadata.StudyDate ?? existingStudy.StudyDate,
    StudyTime: studyMetadata.StudyTime ?? existingStudy.StudyTime,
    StudyDescription: studyMetadata.StudyDescription ?? existingStudy.StudyDescription,
    ModalitiesInStudy: mergedModalities,
    AccessionNumber: studyMetadata.AccessionNumber ?? existingStudy.AccessionNumber,
    NumInstances: studyMetadata.NumInstances ?? existingStudy.NumInstances,
  });
}

/**
 * Fetches all studies for a patient by MRN from the first study
 * and adds them to the DICOM metadata store.
 */
async function fetchAndStorePatientStudies(studyInstanceUID: string, dataSource) {
  try {
    const qidoForStudyUID = await dataSource.query.studies.search({
      studyInstanceUid: studyInstanceUID,
    });

    if (!qidoForStudyUID?.length) {
      console.warn('Could not find study:', studyInstanceUID);
      return [];
    }

    let qidoStudiesForPatient = qidoForStudyUID;
    try {
      qidoStudiesForPatient = await getStudiesForPatientByMRN(dataSource, qidoForStudyUID);
    } catch (error) {
      console.warn('Could not fetch patient studies by MRN:', error);
    }

    const storedStudyUIDs = [];

    qidoStudiesForPatient.forEach(study => {
      const studyMetadata = {
        StudyInstanceUID: study.studyInstanceUid,
        PatientID: study.mrn,
        PatientName: study.patientName,
        StudyDate: study.date,
        StudyTime: study.time,
        StudyDescription: study.description,
        ModalitiesInStudy: normalizeModalities(study.modalities),
        AccessionNumber: study.accession,
        NumInstances: study.instances,
      };

      upsertStudyMetadata(studyMetadata);
      storedStudyUIDs.push(studyMetadata.StudyInstanceUID);
    });

    return storedStudyUIDs;
  } catch (error) {
    console.error('Error fetching patient studies:', error);
    return [];
  }
}

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
  {
    servicesManager,
    studyInstanceUIDs,
    dataSource,
    filters,
  }: withAppTypes & { studyInstanceUIDs?: string[] },
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
    // The display sets are not necessarily in load order, even though the
    // series got started in load order, so re-sort them before hanging
    const sortCriteria = customizationService.getCustomization('sortingCriteria') as (
      a,
      b
    ) => number;

    if (!displaySets || !displaySets.length) {
      return;
    }
    const sortedDisplaySets = [...displaySets].sort(sortCriteria);

    // Gets the studies list to use
    const studies = getStudies(studyInstanceUIDs, sortedDisplaySets);

    // study being displayed, and is thus the "active" study.
    const activeStudy = studies[0];

    // run the hanging protocol matching on the displaySets with the predefined
    // hanging protocol in the mode configuration
    hangingProtocolService.run({ studies, activeStudy, displaySets: sortedDisplaySets }, hangingProtocolId, {
      stageIndex,
    });
  }

  const unsubscriptions = [];
  const issuedWarningSeries = [];
  const { unsubscribe: instanceAddedUnsubscribe } = DicomMetadataStore.subscribe(
    DicomMetadataStore.EVENTS.INSTANCES_ADDED,
    function ({ StudyInstanceUID, SeriesInstanceUID, madeInClient = false }) {
      const seriesMetadata = DicomMetadataStore.getSeries(StudyInstanceUID, SeriesInstanceUID);

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

      displaySetService.makeDisplaySets(seriesMetadata.instances, { madeInClient });
    }
  );

  unsubscriptions.push(instanceAddedUnsubscribe);

  const firstStudyUID = studyInstanceUIDs?.[0];
  const activeStudyUIDs = studyInstanceUIDs?.length
    ? studyInstanceUIDs
    : firstStudyUID
      ? [firstStudyUID]
      : [];
  const patientStudiesPromise = firstStudyUID
    ? fetchAndStorePatientStudies(firstStudyUID, dataSource)
    : Promise.resolve([]);

  log.time(Enums.TimingEnum.STUDY_TO_DISPLAY_SETS);
  log.time(Enums.TimingEnum.STUDY_TO_FIRST_IMAGE);

  const allRetrieves = activeStudyUIDs.map(StudyInstanceUID =>
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

  function startRemainingPromises(remainingPromises) {
    remainingPromises.forEach(p => p.forEach(promise => promise.start()));
  }

  async function collectSeriesPromises(retrieves) {
    const settledRetrieves = await Promise.allSettled(retrieves);
    const requiredSeriesPromises = [];
    const remainingPromises = [];

    settledRetrieves.forEach(retrieve => {
      if (retrieve.status !== 'fulfilled' || !Array.isArray(retrieve.value)) {
        return;
      }

      if (displaySetFromUrl) {
        requiredSeriesPromises.push(...retrieve.value.map(promise => promise.start()));
        return;
      }

      const { requiredSeries, remaining } = hangingProtocolService.filterSeriesRequiredForRun(
        hangingProtocolId,
        retrieve.value
      );

      requiredSeriesPromises.push(...requiredSeries.map(promise => promise.start()));
      remainingPromises.push(remaining);
    });

    return { requiredSeriesPromises, remainingPromises };
  }

  async function startPriorFetches() {
    const patientStudyUIDs = Array.from(new Set(await patientStudiesPromise));
    const activeStudyUIDSet = new Set(activeStudyUIDs);
    const priorStudyUIDs = patientStudyUIDs.filter(uid => uid && !activeStudyUIDSet.has(uid));

    if (!priorStudyUIDs.length) {
      return;
    }

    const priorRetrieves = priorStudyUIDs.map(StudyInstanceUID =>
      dataSource.retrieve.series.metadata({
        StudyInstanceUID,
        filters,
        returnPromises: true,
        sortCriteria: customizationService.getCustomization('sortingCriteria'),
      })
    );

    priorRetrieves.forEach(retrieve => {
      retrieve.catch(error => {
        console.error(error);
      });
    });

    const { requiredSeriesPromises, remainingPromises } =
      await collectSeriesPromises(priorRetrieves);

    await Promise.allSettled(requiredSeriesPromises);
    applyHangingProtocol();
    startRemainingPromises(remainingPromises);
    applyHangingProtocol();
  }

  const { requiredSeriesPromises, remainingPromises } = await collectSeriesPromises(allRetrieves);

  log.timeEnd(Enums.TimingEnum.STUDY_TO_DISPLAY_SETS);
  log.time(Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE);
  log.time(Enums.TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES);

  await Promise.allSettled(requiredSeriesPromises);
  await patientStudiesPromise;
  applyHangingProtocol();
  startRemainingPromises(remainingPromises);
  applyHangingProtocol();

  void startPriorFetches().catch(error => {
    console.error(error);
  });

  return unsubscriptions;
}
