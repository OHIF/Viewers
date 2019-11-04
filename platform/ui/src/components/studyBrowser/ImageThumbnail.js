/* global cornerstone */
import './ImageThumbnail.styl';

import React, { useState, useEffect, createRef } from 'react';

import PropTypes from 'prop-types';
import ViewportErrorIndicator from '../../viewer/ViewportErrorIndicator';
import ViewportLoadingIndicator from '../../viewer/ViewportLoadingIndicator';

// TODO: How should we have this component depend on Cornerstone?
// - Passed in as a prop?
// - Set as external dependency?
// - Pass in the entire load and render function as a prop?
//import cornerstone from 'cornerstone-core';
function ImageThumbnail(props) {
  const {
    width,
    height,
    imageSrc,
    imageId,
    stackPercentComplete,
    error: propsError,
  } = props;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [image, setImage] = useState({});
  const canvasRef = createRef();

  let loadingOrError;
  if (propsError || error) {
    loadingOrError = <ViewportErrorIndicator />;
  } else if (loading) {
    loadingOrError = <ViewportLoadingIndicator />;
  }

  const showStackLoadingProgressBar = stackPercentComplete !== undefined;

  const shouldRenderToCanvas = () => {
    return imageId && !imageSrc;
  };

  const retrieveImageData = () => {
    if (shouldRenderToCanvas()) {
      setLoading(true);
      cornerstone
        .loadAndCacheImage(imageId)
        .then(response => {
          setImage(response);
        })
        .catch(error => {
          setLoading(false);
          setError(true);
          throw new Error(error);
        });
    }
  };

  useEffect(() => {
    if (image.imageId) {
      cornerstone.renderToCanvas(canvasRef.current, image);
      setLoading(false);
    }
  }, [image.imageId]);

  useEffect(() => {
    if (!image.imageId || image.imageId !== imageId) {
      retrieveImageData();
    }
  }, [imageId]);

  return (
    <div className="ImageThumbnail">
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
      {showStackLoadingProgressBar && (
        <div className="image-thumbnail-progress-bar">
          <div
            className="image-thumbnail-progress-bar-inner"
            style={{ width: `${stackPercentComplete}%` }}
          />
        </div>
      )}
      {loading && <div className="image-thumbnail-loading-indicator"></div>}
    </div>
  );
}

ImageThumbnail.propTypes = {
  imageSrc: PropTypes.string,
  imageId: PropTypes.string,
  error: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  stackPercentComplete: PropTypes.number.isRequired,
};

ImageThumbnail.defaultProps = {
  error: false,
  stackPercentComplete: 0,
  width: 217,
  height: 123,
};

export default ImageThumbnail;
