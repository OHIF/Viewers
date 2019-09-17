import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import { api } from 'dicomweb-client';
import OHIF from '@ohif/core';

const findImageIdOnStudies = (studies, displaySetInstanceUid) => {
  const study = studies.find(study => {
    const displaySet = study.displaySets.some(
      displaySet => displaySet.displaySetInstanceUid === displaySetInstanceUid
    );
    return displaySet;
  });
  const { seriesList = [] } = study;
  const { instances = [] } = seriesList[0] || {};
  const instance = instances[0];

  if (instance) {
    return instance.getImageId();
  }
};

const getImageInstance = dataset => {
  return dataset && dataset.images && dataset.images[0];
};

const getImageInstanceId = imageInstance => {
  const imageId = imageInstance && imageInstance.getImageId(null);
  return imageId;
};

const fetchIt = (url, headers) => {
  return fetch(url, headers).then(response => response.arrayBuffer());
};

const cornerstoneRetriever = (imageId, imageInstance) => {
  return cornerstone.loadAndCacheImage(imageId).then(image => {
    return image && image.data && image.data.byteArray.buffer;
  });
};

const wadorsRetriever = (
  imageId,
  imageInstance,
  headers = OHIF.DICOMWeb.getAuthorizationHeader()
) => {
  const config = {
    url: imageInstance.getData().wadoRoot,
    headers,
  };
  const dicomWeb = new api.DICOMwebClient(config);

  return dicomWeb.retrieveInstance({
    studyInstanceUID: imageInstance.getStudyInstanceUID(),
    seriesInstanceUID: imageInstance.getSeriesInstanceUID(),
    sopInstanceUID: imageInstance.getSOPInstanceUID(),
  });
};

const getImageLoaderType = imageId => {
  const loaderRegExp = /^\w+\:/;
  const loaderType = loaderRegExp.exec(imageId);

  return (
    (loaderRegExp.lastIndex === 0 &&
      loaderType &&
      loaderType[0] &&
      loaderType[0].replace(':', '')) ||
    ''
  );
};
const DicomLoaderService = new (class {
  getLocalData(dataset, studies) {
    if (dataset && dataset.localFile) {
      // Use referenced imageInstance
      const imageInstance = getImageInstance(dataset);
      let imageId = getImageInstanceId(imageInstance);

      // or Try to get it from studies
      if (!imageId) {
        imageId = findImageIdOnStudies(studies, dataset.displaySetInstanceUid);
      }

      if (imageId) {
        return cornerstoneWADOImageLoader.wadouri.loadFileRequest(imageId);
      }
    }
  }

  getDataByImageType(dataset) {
    const imageInstance = getImageInstance(dataset);

    if (imageInstance) {
      const imageId = getImageInstanceId(imageInstance);
      let getDicomDataMethod = fetchIt;
      const loaderType = getImageLoaderType(imageId);

      switch (loaderType) {
        case 'dicomfile':
          getDicomDataMethod = cornerstoneRetriever;
          break;
        case 'wadors':
          getDicomDataMethod = wadorsRetriever;
          break;
        case 'wadouri':
          // Strip out the image loader specifier
          imageId = imageId.substring(imageId.indexOf(':') + 1);
          break;
      }

      return getDicomDataMethod(imageId, imageInstance);
    }
  }

  getDataByDatasetType(dataset) {
    const { wadoUri, authorizationHeaders } = dataset;

    if (wadoUri) {
      return fetchIt(wadoUri, { headers: authorizationHeaders });
    }
  }

  *getLoaderIterator(dataset, studies) {
    yield this.getLocalData(dataset, studies);
    yield this.getDataByImageType(dataset);
    yield this.getDataByDatasetType(dataset);
  }

  findDicomDataPromise(dataset, studies) {
    const loaderIterator = this.getLoaderIterator(dataset, studies);
    // it returns first valid retriever method.
    for (const loader of loaderIterator) {
      if (loader) {
        return loader;
      }
    }

    // in case of no valid loader
    throw new Error('Invalid dicom data loader');
  }
})();

export default DicomLoaderService;
