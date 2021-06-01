import { DicomMetadataStore, IWebApiDataSource } from '@ohif/core'
import OHIF from '@ohif/core'

import getImageId from '../DicomWebDataSource/utils/getImageId'

const metadataProvider = OHIF.classes.MetadataProvider
const { EVENTS } = DicomMetadataStore

function createDicomLocalApi(dicomLocalConfig) {
  const { name } = dicomLocalConfig

  const implementation = {
    initialize: ({ params, query }) => {
      const { StudyInstanceUIDs: paramsStudyInstanceUIDs } = params
      const queryStudyInstanceUIDs = query.get('StudyInstanceUIDs')

      const StudyInstanceUIDs =
        queryStudyInstanceUIDs || paramsStudyInstanceUIDs
      const StudyInstanceUIDsAsArray =
        StudyInstanceUIDs && Array.isArray(StudyInstanceUIDs)
          ? StudyInstanceUIDs
          : [StudyInstanceUIDs]
      return StudyInstanceUIDsAsArray
    },
    query: {
      studies: {
        mapParams: () => { },
        search: (params) => {
          const studyUIDs = DicomMetadataStore.getStudyInstanceUIDs()

          return studyUIDs.map(StudyInstanceUID => {
            let numInstances = 0
            const modalities = new Set()

            // Calculating the number of instances in the study and modalities
            // present in the study
            const study = DicomMetadataStore.getStudy(StudyInstanceUID)
            study.series.forEach(aSeries => {
              numInstances += aSeries.instances.length
              modalities.add(aSeries.Modality);
            })

            // first instance in the first series
            const firstInstance = study?.series[0]?.instances[0]

            if (firstInstance) {
              return {
                accession: firstInstance.AccessionNumber,
                date: firstInstance.StudyDate,
                description: firstInstance.StudyDescription,
                mrn: firstInstance.PatientID,
                patientName: firstInstance.PatientName,
                studyInstanceUid: firstInstance.StudyInstanceUID,
                time: firstInstance.StudyTime,
                //
                instances: numInstances,
                modalities: Array.from(modalities).join('/'),
                NumInstances: numInstances,
              };
            }
          })
        },
        processResults: () => {
          console.debug(' DICOMLocal QUERY processResults')
        },
      },
      series: {
        // mapParams: mapParams.bind(),
        search: () => {
          console.debug(' DICOMLocal QUERY SERIES SEARCH')
        },
      },
      instances: {
        search: () => {
          console.debug(' DICOMLocal QUERY instances SEARCH')
        },
      },
    },
    retrieve: {
      series: {
        metaData: () => {
          console.debug(' DICOMLocal retrieve series metadata')
        },
      },
    },
    store: {
      dicom: () => {
        console.debug(' DICOMLocal store dicom')
      },
    },
    retrieveSeriesMetadata: async ({
      StudyInstanceUID,
      madeInClient = false,
    } = {}) => {
      if (!StudyInstanceUID) {
        throw new Error(
          'Unable to query for SeriesMetadata without StudyInstanceUID'
        )
      }

      // Series metadata already added via local upload
      DicomMetadataStore._broadcastEvent(EVENTS.SERIES_ADDED, {
        StudyInstanceUID,
        madeInClient,
      })

      // Instances metadata already added via local upload
      const study = DicomMetadataStore.getStudy(StudyInstanceUID, madeInClient)

      study.series.forEach((aSeries) => {
        const { SeriesInstanceUID } = aSeries

        aSeries.instances.forEach((instance) => {
          const {
            url: imageId,
            StudyInstanceUID,
            SeriesInstanceUID,
            SOPInstanceUID,
          } = instance

            // Add imageId specific mapping to this data as the URL isn't necessarily WADO-URI.
            metadataProvider.addImageIdToUIDs(imageId, {
              StudyInstanceUID,
              SeriesInstanceUID,
              SOPInstanceUID,
            })
          })

        DicomMetadataStore._broadcastEvent(EVENTS.INSTANCES_ADDED, {
          StudyInstanceUID,
          SeriesInstanceUID,
          madeInClient,
        })
      })

    },
    getImageIdsForDisplaySet(displaySet) {
      const images = displaySet.images
      const imageIds = []

      if (!images) {
        return imageIds
      }

      displaySet.images.forEach((instance) => {
        const NumberOfFrames = instance.NumberOfFrames

        if (NumberOfFrames > 1) {
          for (let i = 0; i < NumberOfFrames; i++) {
            const imageId = this.getImageIdsForInstance({
              instance,
              frame: i,
            })
            imageIds.push(imageId)
          }
        } else {
          const imageId = this.getImageIdsForInstance({ instance })
          imageIds.push(imageId)
        }
      })

      return imageIds
    },
    getImageIdsForInstance({ instance, frame }) {
      const imageIds = getImageId({
        instance,
        frame,
      })
      return imageIds
    },
  }
  return IWebApiDataSource.create(implementation)
}

export { createDicomLocalApi }
