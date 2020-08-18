import React from 'react';
import PropTypes from 'prop-types';

import { Thumbnail, ThumbnailNoImage, ThumbnailTracked } from '../';

const ThumbnailList = ({
  thumbnails,
  activeDisplaySetInstanceUID,
  onThumbnailClick,
  onThumbnailDoubleClick,
  onClickUntrack,
}) => {
  return (
    <div className="py-3 bg-black">
      {thumbnails.map(
        ({
          displaySetInstanceUID,
          description,
          dragData,
          seriesNumber,
          numInstances,
          modality,
          componentType,
          seriesDate,
          viewportIdentificator,
          isTracked,
          canReject,
          onReject,
          imageSrc,
          imageAltText,
        }) => {
          const isActive =
            activeDisplaySetInstanceUID === displaySetInstanceUID;

          switch (componentType) {
            case 'thumbnail':
              return (
                <Thumbnail
                  key={displaySetInstanceUID}
                  displaySetInstanceUID={displaySetInstanceUID}
                  dragData={dragData}
                  description={description}
                  seriesNumber={seriesNumber}
                  numInstances={numInstances}
                  imageSrc={imageSrc}
                  imageAltText={imageAltText}
                  viewportIdentificator={viewportIdentificator}
                  isActive={isActive}
                  onClick={() => onThumbnailClick(displaySetInstanceUID)}
                  onDoubleClick={() =>
                    onThumbnailDoubleClick(displaySetInstanceUID)
                  }
                />
              );
            case 'thumbnailTracked':
              return (
                <ThumbnailTracked
                  key={displaySetInstanceUID}
                  displaySetInstanceUID={displaySetInstanceUID}
                  dragData={dragData}
                  description={description}
                  seriesNumber={seriesNumber}
                  numInstances={numInstances}
                  imageSrc={imageSrc}
                  imageAltText={imageAltText}
                  viewportIdentificator={viewportIdentificator}
                  isTracked={isTracked}
                  isActive={isActive}
                  onClick={() => onThumbnailClick(displaySetInstanceUID)}
                  onDoubleClick={() =>
                    onThumbnailDoubleClick(displaySetInstanceUID)
                  }
                  onClickUntrack={() => onClickUntrack(displaySetInstanceUID)}
                />
              );
            case 'thumbnailNoImage':
              return (
                <ThumbnailNoImage
                  isActive={isActive}
                  key={displaySetInstanceUID}
                  displaySetInstanceUID={displaySetInstanceUID}
                  dragData={dragData}
                  modality={modality}
                  modalityTooltip={_getModalityTooltip(modality)}
                  seriesDate={seriesDate}
                  description={description}
                  canReject={canReject}
                  onReject={onReject}
                  onClick={() => onThumbnailClick(displaySetInstanceUID)}
                  onDoubleClick={() =>
                    onThumbnailDoubleClick(displaySetInstanceUID)
                  }
                  viewportIdentificator={viewportIdentificator}
                />
              );
            default:
              return <></>;
          }
        }
      )}
    </div>
  );
};

ThumbnailList.propTypes = {
  thumbnails: PropTypes.arrayOf(
    PropTypes.shape({
      displaySetInstanceUID: PropTypes.string.isRequired,
      imageSrc: PropTypes.string,
      imageAltText: PropTypes.string,
      seriesDate: PropTypes.string,
      seriesNumber: PropTypes.number,
      numInstances: PropTypes.number,
      description: PropTypes.string,
      componentType: PropTypes.oneOf([
        'thumbnail',
        'thumbnailTracked',
        'thumbnailNoImage',
      ]).isRequired,
      viewportIdentificator: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.array,
      ]),
      isTracked: PropTypes.bool,
      /**
       * Data the thumbnail should expose to a receiving drop target. Use a matching
       * `dragData.type` to identify which targets can receive this draggable item.
       * If this is not set, drag-n-drop will be disabled for this thumbnail.
       *
       * Ref: https://react-dnd.github.io/react-dnd/docs/api/use-drag#specification-object-members
       */
      dragData: PropTypes.shape({
        /** Must match the "type" a dropTarget expects */
        type: PropTypes.string.isRequired,
      }),
    })
  ),
  activeDisplaySetInstanceUID: PropTypes.string,
  onThumbnailClick: PropTypes.func.isRequired,
  onThumbnailDoubleClick: PropTypes.func.isRequired,
  onClickUntrack: PropTypes.func.isRequired,
};

// TODO: Support "Viewport Identificator"?
function _getModalityTooltip(modality) {
  if (_modalityTooltips.hasOwnProperty(modality)) {
    return _modalityTooltips[modality];
  }

  return 'Unknown';
}

const _modalityTooltips = {
  SR: 'Structured Report',
};

export default ThumbnailList;
