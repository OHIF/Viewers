import { listStudyInfo, listSeries, listSeriesInstances } from '../qido';
import { retrieveInstanceMetadata } from './retrieveInstanceMetadata';
import {
  dicomWebToDicomStructure,
  dicomWebToRawDicomInstances,
  generateInstanceMetaData,
  generateStudyMetaData,
} from '../metadata/extractMetaData';
import { DicomWebConfig } from '../dicomWebConfig';
import {naturalizeDataset } from '../dicom';
import { DicomMetadataStore, classes, UserAuthenticationService } from '@ohif/core';
import { RetrieveStudyMetadataInterface } from '../Types';
import { retrieveStudyMetadata, deleteStudyMetadataPromise } from './retrieveStudyMetadata';
import { addRetrieveBulkData } from './retrieveBulkData';
import {DICOMwebClient} from 'dicomweb-client/types/api';
import { generateWadoHeader } from '../headers';

export type MetadataProvider = typeof classes.MetadataProvider;

/**
 * Minimum state to pass from an instance of a Dicom Data Source API instance so that we can execute
 * metadata retrieval.
 */
export interface APIDependencies {
  qidoDicomWebClient: DICOMwebClient;
  wadoDicomWebClient: DICOMwebClient;
  metadataProvider: MetadataProvider;
  dicomWebConfig: DicomWebConfig;
  userAuthenticationService?: UserAuthenticationService;
  getImageIdsForInstance?: (arg0: {}) => string;
}

/**
 * Experimental threshold used to determine if to retrieve the full metadata bundle for the study
 * or retrieve the bare minimum required for the viewer to function. This is part of an optimization
 * effort.
 */
const fullMetadataThreshold = 10;

/**
 * Attempts to retrieve the minimum amount of metadata necessary to allow the viewer to operate.
 * Because small bundles of metadata may be retrieved faster, we check if the study has enough slices
 * before requesting individual chunks of metadata. If the study has too few slices, we default to
 * the old behavior of retrieving the full metadata.
 *
 * @param {string} StudyInstanceUID
 * @param {Object} filters
 * @param {???} sortCriteria
 * @param {Function} sortFunction
 * @param {boolean} madeInClient
 * @param {APIDependencies} api
 */
export async function retrieveMinimalSeriesMetadata (
  StudyInstanceUID,
  filters,
  sortCriteria,
  sortFunction,
  madeInClient,
  api: APIDependencies
) {
  const {
    qidoDicomWebClient,
    wadoDicomWebClient,
    metadataProvider,
    dicomWebConfig,
    userAuthenticationService,
    getImageIdsForInstance
  } = api
  const enableStudyLazyLoad = false;

  const studyInfo = (await listStudyInfo(qidoDicomWebClient, StudyInstanceUID)).pop();

  if(studyInfo.instances <= fullMetadataThreshold) {
    return retrieveFullSeriesMetadata(
      StudyInstanceUID,
      filters,
      sortCriteria,
      sortFunction,
      madeInClient,
      api
    )
  }

  // Discover list of series in study
  const seriesList = await listSeries(
    qidoDicomWebClient,
    StudyInstanceUID,
    filters
  )

  // Discover list of instances in each series.
  // We should have an array of arrays by now containing the raw QIDO metadata.
  const instanceMetaList = await Promise.allSettled(
    seriesList.map((series) => {
      return listSeriesInstances(
        qidoDicomWebClient,
        StudyInstanceUID,
        series.seriesInstanceUID
      )
    })
  );

  // For each series, retrieve the first and last instance metadata from the WADO interface.
  // Unfortunately, we have to do this because the QIDO results lack the IPP and other information
  // needed by the viewer to generate a hanging protocol.
  let instances = await Promise.allSettled(
    instanceMetaList.map( (instances) => {
      const items = instances.value;
      return Promise.allSettled(
        [
          retrieveInstanceMetadata(
            wadoDicomWebClient,
            StudyInstanceUID,
            enableStudyLazyLoad,
            items[0],
            sortCriteria,
            sortFunction,
            dicomWebConfig
          ),
          retrieveInstanceMetadata(
            wadoDicomWebClient,
            StudyInstanceUID,
            enableStudyLazyLoad,
            items[items.length - 1],
            sortCriteria,
            sortFunction,
            dicomWebConfig
          ),
        ]
      );
    })
  );

  // Below, we want to grab the raw instance metadata list and generate a study structure such that
  // we have a study global metadata header and a list of series. The list of series contains a list
  // of instances per series. All of these instances have to be Proxy objects because of how
  // dcmjs naturalizes the dataset. Also. note that since we only retrieved 2 slices worth of
  // metadata per series, we have to "reconstruct" the other slices so the hanging protocol's requirements
  // are satisfied! We do this by using the first slice as reference and then patch the IPP information.
  const rawInstances = dicomWebToRawDicomInstances(instances);
  const naturalizedInstancesMetadata= generateInstanceMetaData(instanceMetaList, rawInstances);
  const { seriesSummaryMetadata, instancesPerSeries } = generateStudyMetaData(
    naturalizedInstancesMetadata,
    dicomWebConfig
  );

  // Now, register the study/images with tha metadata provider.
  instancesPerSeries.forEach(instances => {
    instances.forEach(instance => {
      metadataProvider.addImageIdToUIDs(instance.imageId, {
        StudyInstanceUID,
        SeriesInstanceUID: instance.SeriesInstanceUID,
        SOPInstanceUID: instance.SOPInstanceUID,
      });
    });
  });

  // Finally, store the series and instance data into the DicomMetadataStore.
  const seriesMetadata = Object.values(seriesSummaryMetadata);
  DicomMetadataStore.addSeriesMetadata(seriesMetadata, madeInClient);

  Object.keys(instancesPerSeries).forEach(seriesInstanceUID =>
    DicomMetadataStore.addInstances(instancesPerSeries[seriesInstanceUID], madeInClient)
  );

  // At this point the hanging protocol is notified of the data and things should begin drawing
  // on screen.
  // This function replaces `_retrieveSeriesMetadataSync` as a more optimal method of retrieval.
  // Further optimization can be achieved if the DicomWeb standard supported an API like GraphQL.
  // These changes improved load times for a study from seconds to a second overall and transfers
  // of metadata decreased from 29 MB to 1.2MB overall. Image fetching is what slows down the system
  // now.
  return seriesSummaryMetadata;
}

/**
 * Downloads the full set of metadata as one chunk for a given study. This can be potentially expensive
 * even with the aid of DEFLATE. I have seen as much as 29 MB transfers for a study with several CTs.
 *
 * @param {string} StudyInstanceUID
 * @param {Object} filters
 * @param {???} sortCriteria
 * @param {Function} sortFunction
 * @param {boolean} madeInClient
 * @param {APIDependencies} api
 */
export async function retrieveFullSeriesMetadata (
  StudyInstanceUID,
  filters,
  sortCriteria,
  sortFunction,
  madeInClient,
  api: APIDependencies
){
  const {
    qidoDicomWebClient,
    wadoDicomWebClient,
    metadataProvider,
    dicomWebConfig,
    userAuthenticationService,
    getImageIdsForInstance
  } = api
  const enableStudyLazyLoad = false;
  // Skip inclusion of Accept Header options other than the request type of `application/dicom+json`
  // See issue #5288
  wadoDicomWebClient.headers = generateWadoHeader(
    userAuthenticationService,
    dicomWebConfig,
    true
  );
  // data is all SOPInstanceUIDs
  const data = await retrieveStudyMetadata(
    wadoDicomWebClient,
    StudyInstanceUID,
    enableStudyLazyLoad,
    filters,
    sortCriteria,
    sortFunction,
    dicomWebConfig
  );

  // first naturalize the data
  const naturalizedInstancesMetadata = data.map(naturalizeDataset);

  const seriesSummaryMetadata = {};
  const instancesPerSeries = {};

  naturalizedInstancesMetadata.forEach(instance => {
    if (!seriesSummaryMetadata[instance.SeriesInstanceUID]) {
      seriesSummaryMetadata[instance.SeriesInstanceUID] = {
        StudyInstanceUID: instance.StudyInstanceUID,
        StudyDescription: instance.StudyDescription,
        SeriesInstanceUID: instance.SeriesInstanceUID,
        SeriesDescription: instance.SeriesDescription,
        SeriesNumber: instance.SeriesNumber,
        SeriesTime: instance.SeriesTime,
        SOPClassUID: instance.SOPClassUID,
        ProtocolName: instance.ProtocolName,
        Modality: instance.Modality,
      };
    }

    if (!instancesPerSeries[instance.SeriesInstanceUID]) {
      instancesPerSeries[instance.SeriesInstanceUID] = [];
    }

    const imageId = getImageIdsForInstance({
      instance,
    });

    instance.imageId = imageId;
    instance.wadoRoot = dicomWebConfig.wadoRoot;
    instance.wadoUri = dicomWebConfig.wadoUri;

    metadataProvider.addImageIdToUIDs(imageId, {
      StudyInstanceUID,
      SeriesInstanceUID: instance.SeriesInstanceUID,
      SOPInstanceUID: instance.SOPInstanceUID,
    });

    instancesPerSeries[instance.SeriesInstanceUID].push(instance);
  });

  // grab all the series metadata
  const seriesMetadata = Object.values(seriesSummaryMetadata);
  DicomMetadataStore.addSeriesMetadata(seriesMetadata, madeInClient);

  Object.keys(instancesPerSeries).forEach(seriesInstanceUID =>
    DicomMetadataStore.addInstances(instancesPerSeries[seriesInstanceUID], madeInClient)
  );

  return seriesSummaryMetadata;
}

/**
 * Like retrieveFullSeriesMetadata, this function retrieves the metadata
 * for the study. However, it does this asynchronously such that its effect is more like
 * retrieveMinimalSeriesMetadata. The difference is that retrieveMinimalSeriesMetadata is synchronous
 * (blocks), whereas this function does not block and thus gets you to the viewer UI faster.
 * The main consideration is that the async calls started here relies on pre-flighting the request so
 * beware of CORS conflicts if your environment is not configured correctly.
 *
 * @param {string} StudyInstanceUID
 * @param {Object} filters
 * @param {???} sortCriteria
 * @param {Function} sortFunction
 * @param {boolean} madeInClient
 * @param {APIDependencies} api
 */
export async function retrieveSeriesMetadataAsync (
  StudyInstanceUID,
  filters,
  sortCriteria,
  sortFunction,
  api: APIDependencies,
  madeInClient = false,
  returnPromises = false
)  {
  const {
    qidoDicomWebClient,
    wadoDicomWebClient,
    metadataProvider,
    dicomWebConfig,
    userAuthenticationService,
    getImageIdsForInstance
  } = api
  const enableStudyLazyLoad = true;
  // Skip inclusion of Accept Header options other than the request type of `application/dicom+json`
  // See issue #5288
  wadoDicomWebClient.headers = generateWadoHeader(
    userAuthenticationService,
    dicomWebConfig,
    true
  );
  // Get Series
  const results: RetrieveStudyMetadataInterface =
    await retrieveStudyMetadata(
      wadoDicomWebClient,
      StudyInstanceUID,
      enableStudyLazyLoad,
      filters,
      sortCriteria,
      sortFunction,
      dicomWebConfig
    );
  const { preLoadData: seriesSummaryMetadata, promises: seriesPromises } = results;

  // Async load series, store as retrieved
  function storeInstances(instances) {
    const naturalizedInstances = dicomWebToDicomStructure(instances)
      .map(instance =>
        addRetrieveBulkData(
          instance,
          qidoDicomWebClient,
          dicomWebConfig
        ));

    // Adding instanceMetadata to OHIF MetadataProvider
    naturalizedInstances.forEach(instance => {
      instance.wadoRoot = dicomWebConfig.wadoRoot;
      instance.wadoUri = dicomWebConfig.wadoUri;

      const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
      const numberOfFrames = instance.NumberOfFrames || 1;
      // Process all frames consistently, whether single or multiframe
      for (let i = 0; i < numberOfFrames; i++) {
        const frameNumber = i + 1;
        const frameImageId = this.getImageIdsForInstance({
          instance,
          frameNumber,
        });
        // Add imageId specific mapping to this data as the URL isn't necessarily WADO-URI.
        metadataProvider.addImageIdToUIDs(frameImageId, {
          StudyInstanceUID,
          SeriesInstanceUID,
          SOPInstanceUID,
          frameNumber: numberOfFrames > 1 ? frameNumber : undefined,
        });
      }

      // Adding imageId to each instance
      // Todo: This is not the best way I can think of to let external
      // metadata handlers know about the imageId that is stored in the store
      const imageId = this.getImageIdsForInstance({
        instance,
      });
      instance.imageId = imageId;
    });

    DicomMetadataStore.addInstances(naturalizedInstances, madeInClient);
  }

  function setSuccessFlag() {
    const study = DicomMetadataStore.getStudy(StudyInstanceUID);
    if (!study) {
      return;
    }
    study.isLoaded = true;
  }

  // Google Cloud Healthcare doesn't return StudyInstanceUID, so we need to add
  // it manually here
  seriesSummaryMetadata.forEach(aSeries => {
    aSeries.StudyInstanceUID = StudyInstanceUID;
  });

  DicomMetadataStore.addSeriesMetadata(seriesSummaryMetadata, madeInClient);

  const seriesDeliveredPromises = seriesPromises.map(promise => {
    if (!returnPromises) {
      promise?.start();
    }

    return promise.then(instances => {
      storeInstances(instances);
    });
  });

  if (returnPromises) {
    Promise.all(seriesDeliveredPromises).then(() => setSuccessFlag());
    return seriesPromises;
  } else {
    await Promise.all(seriesDeliveredPromises);
    setSuccessFlag();
  }

  return seriesSummaryMetadata;
}

export { retrieveStudyMetadata, deleteStudyMetadataPromise, retrieveInstanceMetadata }
