import { DicomMetadataStore, IWebApiDataSource } from '@ohif/core';
import OHIF from '@ohif/core';
import axios from 'axios';

import getImageId from '../DicomWebDataSource/utils/getImageId';
import getDirectURL from '../utils/getDirectURL';
import filesToStudies from '../../../../platform/app/src/routes/Local/filesToStudies';
const { EVENTS } = DicomMetadataStore;

const metadataProvider = OHIF.classes.MetadataProvider;

const mappings = {
  studyInstanceUid: 'StudyInstanceUID',
  patientId: 'PatientID',
};

let _store = {
  urls: [],
  studyInstanceUIDMap: new Map(), // map of urls to array of study instance UIDs
  instancesData: [{}],
  // {
  //   url: url1
  //   studies: [Study1, Study2], // if multiple studies
  // }
  // {
  //   url: url2
  //   studies: [Study1],
  // }
  // }
};

function wrapSequences(obj) {
  return Object.keys(obj).reduce(
    (acc, key) => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively wrap sequences for nested objects
        acc[key] = wrapSequences(obj[key]);
      } else {
        acc[key] = obj[key];
      }
      if (key.endsWith('Sequence')) {
        acc[key] = OHIF.utils.addAccessors(acc[key]);
      }
      return acc;
    },
    Array.isArray(obj) ? [] : {}
  );
}
const getMetaDataByURL = url => {
  return _store.urls.find(metaData => metaData.url === url);
};

const findStudies = (key, value) => {
  let studies = [];
  _store.urls.map(metaData => {
    metaData.studies.map(aStudy => {
      if (aStudy[key] === value) {
        studies.push(aStudy);
      }
    });
  });
  return studies;
};

function createDicomUrlApi(dicomJsonConfig) {
  // const { wadoRoot } = dicomJsonConfig;

  const implementation = {
    initialize: async ({ query, url }) => {
      if (!url) {
        url = query.get('url');
      }
      let metaData = getMetaDataByURL(url);

      // if we have already cached the data from this specific url
      // We are only handling one StudyInstanceUID to run; however,
      // all studies for patientID will be put in the correct tab
      if (metaData) {
        return metaData.studies.map(aStudy => {
          return aStudy.StudyInstanceUID;
        });
      }

      const response = await fetch(url);
      const data = await response.json();

      //loop through studies to fetch urls in here not server
      let instancesData = [];

      data.studies.forEach(study => {
        study.series.forEach(series => {
          series.instances.forEach(instance => {
            instancesData.push({ StudyInstanceUID: study.StudyInstanceUID, instance });
          });
        });
      });

      _store.urls.push({
        url,
        studies: [...data.studies],
      });
      _store.studyInstanceUIDMap.set(
        url,
        data.studies.map(study => study.StudyInstanceUID)
      );

      _store.instancesData.push(...instancesData);
    },
    query: {
      studies: {
        mapParams: () => {},
        search: async param => {
          const [key, value] = Object.entries(param)[0];
          const mappedParam = mappings[key];

          // todo: should fetch from dicomMetadataStore
          const studies = findStudies(mappedParam, value);

          return studies.map(aStudy => {
            return {
              accession: aStudy.AccessionNumber,
              date: aStudy.StudyDate,
              description: aStudy.StudyDescription,
              instances: aStudy.NumInstances,
              modalities: aStudy.Modalities,
              mrn: aStudy.PatientID,
              patientName: aStudy.PatientName,
              studyInstanceUid: aStudy.StudyInstanceUID,
              NumInstances: aStudy.NumInstances,
              time: aStudy.StudyTime,
            };
          });
        },
        processResults: () => {
          console.warn(' DICOMJson QUERY processResults not implemented');
        },
      },
      series: {
        // mapParams: mapParams.bind(),
        search: () => {
          console.warn(' DICOMJson QUERY SERIES SEARCH not implemented');
        },
      },
      instances: {
        search: () => {
          console.warn(' DICOMJson QUERY instances SEARCH not implemented');
        },
      },
    },
    retrieve: {
      /**
       * Generates a URL that can be used for direct retrieve of the bulkdata
       *
       * @param {object} params
       * @param {string} params.tag is the tag name of the URL to retrieve
       * @param {string} params.defaultPath path for the pixel data url
       * @param {object} params.instance is the instance object that the tag is in
       * @param {string} params.defaultType is the mime type of the response
       * @param {string} params.singlepart is the type of the part to retrieve
       * @param {string} params.fetchPart unknown?
       * @returns an absolute URL to the resource, if the absolute URL can be retrieved as singlepart,
       *    or is already retrieved, or a promise to a URL for such use if a BulkDataURI
       */
      directURL: params => {
        return getDirectURL(dicomJsonConfig, params);
      },
      series: {
        metadata: async ({ StudyInstanceUID, madeInClient = false, customSort } = {}) => {
          if (!StudyInstanceUID) {
            throw new Error('Unable to query for SeriesMetadata without StudyInstanceUID');
          }

          const studyInstancesToRetrieve = _store.instancesData.filter(i => i.StudyInstanceUID === StudyInstanceUID);

          const filePromises = studyInstancesToRetrieve.map(async instanceData => {
            const response = await axios({
              url: instanceData.instance.url.replace('dicomweb:', ''),
              method: 'GET',
              responseType: 'blob',
              headers: {
                Accept: 'application/dicom',
              },
            });

            const blob = response.data;
            return new File([blob], instanceData.instance.name, { type: 'application/dicom' });
          });

          // Ensure you await the resolution of the promises
          const files = await Promise.all(filePromises);
          await filesToStudies(files);

          const study = DicomMetadataStore.getStudy(StudyInstanceUID, madeInClient);


          study.series.forEach(aSeries => {
            const { SeriesInstanceUID } = aSeries;

            const isMultiframe = aSeries.instances[0].NumberOfFrames > 1;

            aSeries.instances.forEach((instance, index) => {
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
                frameIndex: isMultiframe ? index : 1,
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
      dicom: () => {
        console.warn(' DICOMJson store dicom not implemented');
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
            const imageId = getImageId({
              instance,
              frame: i,
              config: dicomJsonConfig,
            });
            imageIds.push(imageId);
          }
        } else {
          const imageId = getImageId({ instance, config: dicomJsonConfig });
          imageIds.push(imageId);
        }
      });

      return imageIds;
    },
    getImageIdsForInstance({ instance, frame }) {
      const imageIds = getImageId({ instance, frame });
      return imageIds;
    },
    deleteStudyMetadataPromise() {
      console.log('deleteStudyMetadataPromise not implemented');
    },
    getStudyInstanceUIDs: ({ params, query }) => {
      const url = query.get('url');
      return _store.studyInstanceUIDMap.get(url);
    },
  };
  return IWebApiDataSource.create(implementation);
}

export { createDicomUrlApi };
