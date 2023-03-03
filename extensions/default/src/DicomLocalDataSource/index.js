import { DicomMetadataStore, IWebApiDataSource } from '@ohif/core';
import OHIF from '@ohif/core';
import dcmjs from 'dcmjs';

const metadataProvider = OHIF.classes.MetadataProvider;
const { EVENTS } = DicomMetadataStore;

const END_MODALITIES = {
  SR: true,
  SEG: true,
  DOC: true,
};

const compareValue = (v1, v2, def = 0) => {
  if (v1 === v2) return def;
  if (v1 < v2) return -1;
  return 1;
};

// Sorting SR modalities to be at the end of series list
const customSort = (seriesA, seriesB) => {
  const instanceA = seriesA.instances[0];
  const instanceB = seriesB.instances[0];
  const modalityA = instanceA.Modality;
  const modalityB = instanceB.Modality;

  const isEndA = END_MODALITIES[modalityA];
  const isEndB = END_MODALITIES[modalityB];

  if (isEndA && isEndB) {
    // Compare by series date
    return compareValue(instanceA.SeriesNumber, instanceB.SeriesNumber);
  }
  if (!isEndA && !isEndB) {
    return compareValue(instanceB.SeriesNumber, instanceA.SeriesNumber);
  }
  return isEndA ? -1 : 1;
};

function createDicomLocalApi(dicomLocalConfig) {
  const { name } = dicomLocalConfig;

  const implementation = {
    initialize: ({ params, query }) => {
      const { StudyInstanceUIDs: paramsStudyInstanceUIDs } = params;
      const queryStudyInstanceUIDs = query.getAll('StudyInstanceUIDs');

      const StudyInstanceUIDs =
        queryStudyInstanceUIDs || paramsStudyInstanceUIDs;
      const StudyInstanceUIDsAsArray =
        StudyInstanceUIDs && Array.isArray(StudyInstanceUIDs)
          ? StudyInstanceUIDs
          : [StudyInstanceUIDs];

      // Put SRs at the end of series list to make sure images are loaded first
      StudyInstanceUIDsAsArray.forEach(StudyInstanceUID => {
        const study = DicomMetadataStore.getStudy(StudyInstanceUID);
        study.series = study.series.sort(customSort);
      });

      return StudyInstanceUIDsAsArray;
    },
    query: {
      studies: {
        mapParams: () => {},
        search: params => {
          const studyUIDs = DicomMetadataStore.getStudyInstanceUIDs();

          return studyUIDs.map(StudyInstanceUID => {
            let numInstances = 0;
            const modalities = new Set();

            // Calculating the number of instances in the study and modalities
            // present in the study
            const study = DicomMetadataStore.getStudy(StudyInstanceUID);
            study.series.forEach(aSeries => {
              numInstances += aSeries.instances.length;
              modalities.add(aSeries.Modality);
            });

            // first instance in the first series
            const firstInstance = study?.series[0]?.instances[0];

            if (firstInstance) {
              return {
                accession: firstInstance.AccessionNumber,
                date: firstInstance.StudyDate,
                description: firstInstance.StudyDescription,
                mrn: firstInstance.PatientID,
                patientName: { Alphabetic: firstInstance.PatientName },
                studyInstanceUid: firstInstance.StudyInstanceUID,
                time: firstInstance.StudyTime,
                //
                instances: numInstances,
                modalities: Array.from(modalities).join('/'),
                NumInstances: numInstances,
              };
            }
          });
        },
        processResults: () => {
          console.debug(' DICOMLocal QUERY processResults');
        },
      },
      series: {
        // mapParams: mapParams.bind(),
        search: () => {
          console.debug(' DICOMLocal QUERY SERIES SEARCH');
        },
      },
      instances: {
        search: () => {
          console.debug(' DICOMLocal QUERY instances SEARCH');
        },
      },
    },
    retrieve: {
      series: {
        metadata: async ({ StudyInstanceUID, madeInClient = false } = {}) => {
          if (!StudyInstanceUID) {
            throw new Error(
              'Unable to query for SeriesMetadata without StudyInstanceUID'
            );
          }

          // Instances metadata already added via local upload
          const study = DicomMetadataStore.getStudy(
            StudyInstanceUID,
            madeInClient
          );

          // Series metadata already added via local upload
          DicomMetadataStore._broadcastEvent(EVENTS.SERIES_ADDED, {
            StudyInstanceUID,
            madeInClient,
          });

          study.series.forEach(aSeries => {
            const { SeriesInstanceUID } = aSeries;

            aSeries.instances.forEach(instance => {
              const {
                url: imageId,
                StudyInstanceUID,
                SeriesInstanceUID,
                SOPInstanceUID,
              } = instance;

              instance.imageId = imageId;

              // Add imageId specific mapping to this data as the URL isn't necessarily WADO-URI.
              metadataProvider.addImageIdToUIDs(imageId, {
                StudyInstanceUID,
                SeriesInstanceUID,
                SOPInstanceUID,
              });
            });

            DicomMetadataStore._broadcastEvent(EVENTS.INSTANCES_ADDED, {
              StudyInstanceUID,
              SeriesInstanceUID,
              madeInClient,
            });
          });
        },
      },
    },
    store: {
      dicom: naturalizedReport => {
        const reportBlob = dcmjs.data.datasetToBlob(naturalizedReport);

        //Create a URL for the binary.
        var objectUrl = URL.createObjectURL(reportBlob);
        window.location.assign(objectUrl);
      },
    },
    getImageIdsForDisplaySet(displaySet) {
      const images = displaySet.images;
      const imageIds = [];

      if (!images) {
        return imageIds;
      }

      displaySet.images.forEach(instance => {
        const NumberOfFrames = instance.NumberOfFrames;
        if (NumberOfFrames > 1) {
          for (let i = 0; i < NumberOfFrames; i++) {
            const imageId = this.getImageIdsForInstance({
              instance,
              frame: i,
            });
            imageIds.push(imageId);
          }
        } else {
          const imageId = this.getImageIdsForInstance({ instance });
          imageIds.push(imageId);
        }
      });

      return imageIds;
    },
    getImageIdsForInstance({ instance, frame }) {
      const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
      const storedInstance = DicomMetadataStore.getInstance(
        StudyInstanceUID,
        SeriesInstanceUID,
        SOPInstanceUID
      );

      let imageId = storedInstance.url;

      if (frame !== undefined) {
        imageId += `&frame=${frame}`;
      }

      return imageId;
    },
    deleteStudyMetadataPromise() {
      console.log('deleteStudyMetadataPromise not implemented');
    },
  };
  return IWebApiDataSource.create(implementation);
}

export { createDicomLocalApi };
