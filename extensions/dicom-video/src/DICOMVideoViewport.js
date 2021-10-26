import React, { useEffect, useState } from 'react';
import dcmjs from 'dcmjs';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import './DICOMVideoViewport.css';
import LoadingIndicator from './components/LoadingIndicator';
import requestVideoFile from './requestVideoFile';

const { DicomMessage, DicomMetaDictionary } = dcmjs.data;
const cache = {};

const DICOMVideoViewport = ({
  viewportData,
  setViewportActive,
  viewportIndex,
  studies,
}) => {
  const DEFAULT_MIME_TYPE = 'video/mp4';
  const [state, setState] = useState({
    src: '',
    type: DEFAULT_MIME_TYPE,
    playbackRate: 20,
    errorMessage: null,
  });

  useEffect(() => {
    const handleError = error =>
      setState(state => ({
        ...state,
        isLoading: false,
        errorMessage: error.message || 'Failed to load video',
      }));

    const loadVideo = async () => {
      try {
        setState(state => ({ ...state, isLoading: true }));
        const { displaySet } = viewportData;
        const { videoUrl } = displaySet;
        if (videoUrl) {
          setState(state => ({
            ...state,
            src: videoUrl,
            isLoading: false,
            errorMessage: null,
          }));
          return;
        }

        let imageUrl = displaySet.localFile
          ? displaySet.imageId
          : displaySet.wadouri.replace('dicomweb', 'https');

        if (cache[imageUrl]) {
          setState(state => ({
            ...state,
            src: cache[imageUrl],
            isLoading: false,
            errorMessage: null,
          }));
          return;
        }

        const handleFetchedVideo = ({ src: videoObjectURL, type }) => {
          cache[imageUrl] = videoObjectURL;
          setState(state => ({
            ...state,
            src: cache[imageUrl],
            type: type ? type.mime : DEFAULT_MIME_TYPE,
            isLoading: false,
            errorMessage: null,
          }));
        };

        if (cache[imageUrl]) {
          cache[imageUrl].then(handleFetchedVideo).catch(handleError);
          return;
        }

        if (displaySet.localFile) {
          const dicomFile = await cornerstoneWADOImageLoader.wadouri.loadFileRequest(
            displaySet.imageId
          );
          const dicomData = DicomMessage.readFile(dicomFile);
          const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
          const videoBlob = new Blob([dataset.PixelData], {
            type: DEFAULT_MIME_TYPE,
          });
          const videoObjectURL = (
            window.webkitURL || window.URL
          ).createObjectURL(videoBlob);
          handleFetchedVideo({ src: videoObjectURL });
          return;
        }

        cache[imageUrl] = requestVideoFile({ url: imageUrl })
          .then(handleFetchedVideo)
          .catch(handleError);
      } catch (error) {
        handleError(error);
      }
    };
    loadVideo();
  }, [viewportData]);

  const onViewportClickHandler = () => setViewportActive(viewportIndex);

  console.log('VideoViewport:', state.isLoading, state.src);
  // The duplicated source elements below is to work around a firefox bug
  // that sometimes fails to read the first value
  return (
    <div className="DICOMVideoViewport" onClick={onViewportClickHandler}>
      {state.isLoading && <LoadingIndicator />}
      {!state.isLoading && !state.errorMessage && (
        <video
          controls
          controlsList="nodownload"
          preload="auto"
        >
          <source src={state.src} type={state.type} />
          <source src={state.src} type={state.type} />
          Video src/type not supported: <a href={state.src}>{state.src} of type {state.type}</a>
        </video>
      )}
    </div>
  );
};

export default DICOMVideoViewport;
