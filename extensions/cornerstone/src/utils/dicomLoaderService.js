import { imageLoader } from '@cornerstonejs/core';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import { api } from 'dicomweb-client';
import { DICOMWeb, errorHandler } from '@ohif/core';

const getImageId = imageObj => {
  if (!imageObj) {
    return;
  }

  return typeof imageObj.getImageId === 'function' ? imageObj.getImageId() : imageObj.url;
};

const findImageIdOnStudies = (studies, displaySetInstanceUID) => {
  const study = studies.find(study => {
    const displaySet = study.displaySets.some(
      displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
    );
    return displaySet;
  });
  const { series = [] } = study;
  const { instances = [] } = series[0] || {};
  const instance = instances[0];

  return getImageId(instance);
};

const someInvalidStrings = strings => {
  const stringsArray = Array.isArray(strings) ? strings : [strings];
  const emptyString = string => !string;
  let invalid = stringsArray.some(emptyString);
  return invalid;
};

const getImageInstance = dataset => {
  return dataset && dataset.images && dataset.images[0];
};

const getNonImageInstance = dataset => {
  return dataset && dataset.instance;
};

const getImageInstanceId = imageInstance => {
  return getImageId(imageInstance);
};

const fetchIt = (url, headers = DICOMWeb.getAuthorizationHeader()) => {
  return fetch(url, headers).then(response => response.arrayBuffer());
};

const cornerstoneRetriever = imageId => {
  return imageLoader.loadAndCacheImage(imageId).then(image => {
    return image && image.data && image.data.byteArray.buffer;
  });
};

const wadorsRetriever = (
  url,
  studyInstanceUID,
  seriesInstanceUID,
  sopInstanceUID,
  headers = DICOMWeb.getAuthorizationHeader(),
  errorInterceptor = errorHandler.getHTTPErrorHandler()
) => {
  const config = {
    url,
    headers,
    errorInterceptor,
  };
  const dicomWeb = new api.DICOMwebClient(config);

  return dicomWeb.retrieveInstance({
    studyInstanceUID,
    seriesInstanceUID,
    sopInstanceUID,
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

class DicomLoaderService {
  getLocalData(dataset, studies) {
    // Use referenced imageInstance
    const imageInstance = getImageInstance(dataset);
    const nonImageInstance = getNonImageInstance(dataset);

    if (
      (!imageInstance && !nonImageInstance) ||
      !nonImageInstance.imageId?.startsWith('dicomfile')
    ) {
      return;
    }

    const instance = imageInstance || nonImageInstance;

    let imageId = getImageInstanceId(instance);

    // or Try to get it from studies
    if (someInvalidStrings(imageId)) {
      imageId = findImageIdOnStudies(studies, dataset.displaySetInstanceUID);
    }

    if (!someInvalidStrings(imageId)) {
      return dicomImageLoader.wadouri.loadFileRequest(imageId);
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
          getDicomDataMethod = cornerstoneRetriever.bind(this, imageId);
          break;
        case 'wadors':
          const url = imageInstance.getData().wadoRoot;
          const studyInstanceUID = imageInstance.getStudyInstanceUID();
          const seriesInstanceUID = imageInstance.getSeriesInstanceUID();
          const sopInstanceUID = imageInstance.getSOPInstanceUID();
          const invalidParams = someInvalidStrings([
            url,
            studyInstanceUID,
            seriesInstanceUID,
            sopInstanceUID,
          ]);
          if (invalidParams) {
            return;
          }

          getDicomDataMethod = wadorsRetriever.bind(
            this,
            url,
            studyInstanceUID,
            seriesInstanceUID,
            sopInstanceUID
          );
          break;
        case 'wadouri':
          // Strip out the image loader specifier
          imageId = imageId.substring(imageId.indexOf(':') + 1);

          if (someInvalidStrings(imageId)) {
            return;
          }
          getDicomDataMethod = fetchIt.bind(this, imageId);
          break;
        default:
          throw new Error(`Unsupported image type: ${loaderType} for imageId: ${imageId}`);
      }

      return getDicomDataMethod();
    }
  }

  getDataByDatasetType(dataset) {
    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID,
      authorizationHeaders,
      wadoRoot,
      wadoUri,
      instance,
    } = dataset;
    // Retrieve wadors or just try to fetch wadouri
    if (!someInvalidStrings(wadoRoot)) {
      return wadorsRetriever(
        wadoRoot,
        StudyInstanceUID,
        SeriesInstanceUID,
        SOPInstanceUID,
        authorizationHeaders
      );
    } else if (!someInvalidStrings(wadoUri)) {
      return fetchIt(wadoUri, { headers: authorizationHeaders });
    } else if (!someInvalidStrings(instance?.url)) {
      // make sure the url is absolute, remove the scope
      // from it if it is not absolute. For instance it might be dicomweb:http://....
      // and we need to remove the dicomweb: part
      const url = instance.url;
      const absoluteUrl = url.startsWith('http') ? url : url.substring(url.indexOf(':') + 1);
      return fetchIt(absoluteUrl, { headers: authorizationHeaders });
    }
  }

  *getLoaderIterator(dataset, studies, headers) {
    yield this.getLocalData(dataset, studies);
    yield this.getDataByImageType(dataset);
    yield this.getDataByDatasetType(dataset);
  }

  findDicomDataPromise(dataset, studies, headers) {
    dataset.authorizationHeaders = headers;
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
}

const dicomLoaderService = new DicomLoaderService();

export default dicomLoaderService;
