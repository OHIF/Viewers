/* global cornerstone */
import './XNATImageThumbnail.styl';

import { utils } from '@ohif/core';
import React, { useState, useEffect, createRef, useCallback } from 'react';
import classNames from 'classnames';

import PropTypes from 'prop-types';
import ViewportErrorIndicator from './ViewportErrorIndicator';
import ViewportLoadingIndicator from './ViewportLoadingIndicator';
import DisplaySetLoadingIndicator from './DisplaySetLoadingIndicator';
import renderThumbnailOverlay from './utils/renderThumbnailOverlay';
import checkAndFixVoi from './utils/checkAndFixVoi';
import { Icon } from '@ohif/ui';

// TODO: How should we have this component depend on Cornerstone?
// - Passed in as a prop?
// - Set as external dependency?
// - Pass in the entire load and render function as a prop?
//import cornerstone from 'cornerstone-core';
function XNATImageThumbnail(props) {
  const {
    active,
    width,
    height,
    imageSrc,
    imageId,
    stackPercentComplete,
    error: propsError,
    displaySetInstanceUID,
    modality,
    isValidMultiStack,
    hasMultiDisplaySets,
  } = props;

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [details, setDetails] = useState('');
  const [image, setImage] = useState({});
  const canvasRef = createRef();

  let loadingOrError;
  let cancelablePromise;

  if (propsError || error) {
    loadingOrError = <ViewportErrorIndicator details={details} />;
  } else if (isLoading) {
    loadingOrError = <ViewportLoadingIndicator />;
  }

  // const showStackLoadingProgressBar = stackPercentComplete !== undefined;

  const shouldRenderToCanvas = () => {
    return imageId && !imageSrc;
  };

  const fetchImagePromise = useCallback(() => {
    if (!cancelablePromise) {
      return;
    }

    setLoading(true);
    cancelablePromise
      .then(response => {
        setImage(response);
      })
      .catch(error => {
        if (error.isCanceled) return;
        setLoading(false);
        setError(true);
        if (error && error.error && error.error.message) {
          setDetails(error.error.message);
        }
        throw new Error(error);
      });
  }, [cancelablePromise]);

  const setImagePromise = useCallback(() => {
    if (shouldRenderToCanvas()) {
      cancelablePromise = utils.makeCancelable(
        cornerstone.loadAndCacheImage(imageId)
      );
    }
  }, [imageId]);

  const purgeCancelablePromise = useCallback(() => {
    if (cancelablePromise) {
      cancelablePromise.cancel();
    }
  }, [cancelablePromise]);

  useEffect(() => {
    return () => {
      purgeCancelablePromise();
    };
  }, []);

  useEffect(() => {
    if (image.imageId) {
      checkAndFixVoi(image);
      cornerstone.renderToCanvas(canvasRef.current, image, {
        rotation: image.angle,
      });
      renderThumbnailOverlay(canvasRef.current, image);
      setLoading(false);
    }
  }, [image.imageId]);

  useEffect(() => {
    if (!image.imageId || image.imageId !== imageId) {
      purgeCancelablePromise();
      setImagePromise();
      fetchImagePromise();
    }
  }, [imageId]);

  const multiStackInfo = (
    <div className="multi-stack-tag">
      {hasMultiDisplaySets && (
        <Icon name="xnat-scan-group" title="Multiple Enhanced images" />
      )}
      {isValidMultiStack && (
        <Icon name="xnat-stack" title="Multi-stack image" />
      )}
    </div>
  );

  return (
    <div className={classNames('ImageThumbnail', { active: active })}>
      {multiStackInfo}
      <div className="modality-tag">{modality}</div>
      <div className="image-thumbnail-canvas">
        {shouldRenderToCanvas() ? (
          <canvas ref={canvasRef} width={width} height={height} />
        ) : (
          <img
            className="static-image"
            src={imageSrc}
            //width={this.props.width}
            height={height}
            alt={''}
          />
        )}
      </div>
      {loadingOrError}
      <DisplaySetLoadingIndicator
        displaySetInstanceUID={displaySetInstanceUID}
      />
      {/*{showStackLoadingProgressBar && (*/}
      {/*  <div className="image-thumbnail-progress-bar">*/}
      {/*    <div*/}
      {/*      className="image-thumbnail-progress-bar-inner"*/}
      {/*      style={{ width: `${stackPercentComplete}%` }}*/}
      {/*    />*/}
      {/*  </div>*/}
      {/*)}*/}
      {isLoading && <div className="image-thumbnail-loading-indicator" />}
    </div>
  );
}

XNATImageThumbnail.propTypes = {
  active: PropTypes.bool,
  imageSrc: PropTypes.string,
  imageId: PropTypes.string,
  error: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  stackPercentComplete: PropTypes.number.isRequired,
  displaySetInstanceUID: PropTypes.string,
  modality: PropTypes.string,
};

XNATImageThumbnail.defaultProps = {
  active: false,
  error: false,
  stackPercentComplete: 0,
  width: 217,
  height: 123,
};

export { XNATImageThumbnail };
