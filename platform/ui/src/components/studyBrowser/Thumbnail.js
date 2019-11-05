import React from 'react';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';
import ImageThumbnail from './ImageThumbnail';
import classNames from 'classnames';

import './Thumbnail.styl';

function ThumbnailFooter({
  seriesDescription,
  seriesNumber,
  instanceNumber,
  numImageFrames,
}) {
  const infoOnly = !seriesDescription;

  const getInfo = (value, icon, className = '') => {
    return (
      <div className={classNames('item item-series', className)}>
        <div className="icon">{icon}</div>
        <div className="value">{value}</div>
      </div>
    );
  };
  const getSeriesInformation = (
    seriesNumber,
    instanceNumber,
    numImageFrames
  ) => {
    if (!seriesNumber && !instanceNumber && !numImageFrames) {
      return;
    }

    return (
      <div className="series-information">
        {getInfo(seriesNumber, 'S:')}
        {getInfo(instanceNumber, 'I:')}
        {getInfo(numImageFrames, '', 'image-frames')}
      </div>
    );
  };

  return (
    <div className={classNames('series-details', { 'info-only': infoOnly })}>
      <div className="series-description">{seriesDescription}</div>
      {getSeriesInformation(seriesNumber, instanceNumber, numImageFrames)}
    </div>
  );
}

function Thumbnail(props) {
  const {
    active,
    altImageText,
    error,
    displaySetInstanceUid,
    imageId,
    imageSrc,
    instanceNumber,
    numImageFrames,
    seriesDescription,
    seriesNumber,
    stackPercentComplete,
    studyInstanceUid,
    onClick,
    onDoubleClick,
    onMouseDown,
    supportsDrag,
  } = props;

  const [collectedProps, drag, dragPreview] = useDrag({
    // `droppedItem` in `dropTarget`
    // The only data it will have access to
    item: {
      studyInstanceUid,
      displaySetInstanceUid,
      type: 'thumbnail', // Has to match `dropTarget`'s type
    },
    canDrag: function(monitor) {
      return supportsDrag;
    },
  });

  const hasImage = imageSrc || imageId;
  const hasAltText = altImageText !== undefined;

  return (
    <div
      ref={drag}
      className={classNames('thumbnail', { active: active })}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
    >
      {/* SHOW IMAGE */}
      {hasImage && (
        <ImageThumbnail
          imageSrc={imageSrc}
          imageId={imageId}
          error={error}
          stackPercentComplete={stackPercentComplete}
        />
      )}
      {/* SHOW TEXT ALTERNATIVE */}
      {!hasImage && hasAltText && (
        <div className={'alt-image-text p-x-1'}>
          <h1>{altImageText}</h1>
        </div>
      )}
      {ThumbnailFooter(props)}
    </div>
  );
}

const noop = () => {};

Thumbnail.propTypes = {
  supportsDrag: PropTypes.bool,
  id: PropTypes.string.isRequired,
  displaySetInstanceUid: PropTypes.string.isRequired,
  studyInstanceUid: PropTypes.string.isRequired,
  imageSrc: PropTypes.string,
  imageId: PropTypes.string,
  error: PropTypes.bool,
  active: PropTypes.bool,
  stackPercentComplete: PropTypes.number,
  /**
  altImageText will be used when no imageId or imageSrc is provided.
It will be displayed inside the <div>. This is useful when it is difficult
  to make a preview for a type of DICOM series (e.g. DICOM-SR)
  */
  altImageText: PropTypes.string,
  seriesDescription: PropTypes.string,
  seriesNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  instanceNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  numImageFrames: PropTypes.number,
  onDoubleClick: PropTypes.func,
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
};

Thumbnail.defaultProps = {
  supportsDrag: false,
  active: false,
  error: false,
  stackPercentComplete: 0,
  onDoubleClick: noop,
  onClick: noop,
  onMouseDown: noop,
};

export { Thumbnail };
