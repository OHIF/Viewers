import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import { api } from 'dicomweb-client';
import OHIF from '@ohif/core';

const getImageId = (studies, studyIndex) => {
  const study = studies[studyIndex];
  const { seriesList = [] } = study;
  const { instances = [] } = seriesList[0] || {};
  const instance = instances[0];

  if (instance) {
    return instance.getImageId();
  }
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
      const imageId = getImageId(studies, dataset.studyIndex);
      if (imageId) {
        return cornerstoneWADOImageLoader.wadouri.loadFileRequest(imageId);
      }
    }
  }

  getDataByImageType(dataset, studies) {
    // look into dataset first
    const imageInstance = dataset && dataset.images && dataset.images[0];

    if (imageInstance) {
      const imageId = imageInstance.getImageId(null);

      if (!imageId) {
        return;
      }

      let getDicomData = fetchIt;
      const loaderType = getImageLoaderType(imageId);

      switch (loaderType) {
        case 'dicomfile':
          getDicomData = cornerstoneRetriever;
          break;
        case 'wadors':
          getDicomData = wadorsRetriever;
          break;
        case 'wadouri':
          // Strip out the image loader specifier
          imageId = imageId.substring(imageId.indexOf(':') + 1);
          break;
      }

      return getDicomData(imageId, imageInstance);
    }
  }

  getDataByDatasetType(dataset, studies) {
    const { wadoUri, authorizationHeaders } = dataset;

    if (wadoUri) {
      return fetchIt(wadoUri, { headers: authorizationHeaders });
    }
  }

  *getLoaderIterator(dataset, studies) {
    yield this.getLocalData(dataset, studies);
    yield this.getDataByImageType(dataset, studies);
    yield this.getDataByDatasetType(dataset, studies);
  }

  getDicomData(dataset, studies) {
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
