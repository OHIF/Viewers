import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import { api } from 'dicomweb-client';
import OHIF from '@ohif/core';

const getImageIdByIndex = (studies, studyIndex) => {
  const study = studies[studyIndex];
  const { seriesList = [] } = study;
  const { instances = [] } = seriesList[0] || {};
  const instance = instances[0];

  if (instance) {
    return instance.getImageId();
  }
};

const getImageIdByDataset = dataset => {
  const imageInstance = dataset && dataset.images && dataset.images[0];
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
  getDataByImage(dataset) {
    // look into dataset first
    const imageId = getImageIdByDataset(dataset);
    if (imageId) {
      return cornerstoneWADOImageLoader.wadouri.loadFileRequest(imageId);
    }
  }

  getLocalData(dataset, studies) {
    if (dataset && dataset.localFile) {
      const imageId = getImageIdByIndex(studies, dataset.studyIndex);
      if (imageId) {
        return cornerstoneWADOImageLoader.wadouri.loadFileRequest(imageId);
      }
    }
  }

  getDataByImageType(dataset) {
    const imageId = getImageIdByDataset(dataset);

    if (imageId) {
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
    yield this.getDataByImage(dataset);
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
