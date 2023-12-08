import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import { api } from 'dicomweb-client';
import DICOMWeb from '../DICOMWeb';

import errorHandler from '../errorHandler';
import getXHRRetryRequestHook from './xhrRetryRequestHook';

const getImageId = imageObj => {
  if (!imageObj) {
    return;
  }

  return typeof imageObj.getImageId === 'function'
    ? imageObj.getImageId()
    : imageObj.url;
};

const findImageIdOnStudies = (studies, displaySetInstanceUID) => {
  const study = studies.find(study => {
    const foundDisplaySet = study.displaySets.some(
      displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
    );

    return foundDisplaySet;
  });

  const displaySet = study.displaySets.find(displaySet => {
    return displaySet.displaySetInstanceUID === displaySetInstanceUID;
  });

  const seriesInstanceUid = displaySet.SeriesInstanceUID;
  const sopInstanceUid = displaySet.SOPInstanceUID;

  const { series = [] } = study;

  const a_series = series.find(a_series => {
    return a_series.SeriesInstanceUID == seriesInstanceUid;
  });

  const { instances = [] } = a_series || {};

  const instance = instances.find(instance => {
    return instance.metadata.SOPInstanceUID == sopInstanceUid;
  });

  return getImageId(instance);
};

const someInvalidStrings = strings => {
  const stringsArray = Array.isArray(strings) ? strings : [strings];
  const emptyString = string => !string;
  let invalid = stringsArray.some(emptyString);
  return invalid;
};

const getImageInstance = (displaySet, studies) => {
  const study = studies.find(
    s => s.StudyInstanceUID === displaySet.StudyInstanceUID
  );
  const series = study.series.find(
    s => s.SeriesInstanceUID === displaySet.SeriesInstanceUID
  );
  const instance = series.instances.find(
    i => i.metadata.SOPInstanceUID === displaySet.SOPInstanceUID
  );
  if (instance) {
    return instance;
  }

  return displaySet && displaySet.images && displaySet.images[0];
};

const getImageInstanceId = imageInstance => {
  return getImageId(imageInstance);
};

const fetchIt = (url, headers = DICOMWeb.getAuthorizationHeader()) => {
  return fetch(url, headers).then(response => response.arrayBuffer());
};

const cornerstoneRetriever = imageId => {
  return cornerstone.loadAndCacheImage(imageId).then(image => {
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
    requestHooks: [getXHRRetryRequestHook()],
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
  getLocalData(displaySet, studies) {
    if (displaySet && displaySet.localFile) {
      // Use referenced imageInstance
      const imageInstance = getImageInstance(displaySet);
      let imageId = getImageInstanceId(imageInstance);

      // or Try to get it from studies
      if (someInvalidStrings(imageId)) {
        imageId = findImageIdOnStudies(studies, displaySet.displaySetInstanceUID);
      }

      if (!someInvalidStrings(imageId)) {
        return cornerstoneWADOImageLoader.wadouri.loadFileRequest(imageId);
      }
    }
  }

  getDataByImageType(displaySet, studies) {
    const imageInstance = getImageInstance(displaySet, studies);

    if (imageInstance) {
      let imageId = getImageInstanceId(imageInstance);
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
      }

      return getDicomDataMethod();
    }
  }

  getDataByDisplaySetType(displaySet) {
    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID,
      authorizationHeaders,
      wadoRoot,
      wadoUri,
    } = displaySet;
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
    }
  }

  *getLoaderIterator(displaySet, studies) {
    yield this.getLocalData(displaySet, studies);
    yield this.getDataByImageType(displaySet, studies);
    yield this.getDataByDisplaySetType(displaySet);
  }

  findDicomDataPromise(displaySet, studies) {
    const loaderIterator = this.getLoaderIterator(displaySet, studies);
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
