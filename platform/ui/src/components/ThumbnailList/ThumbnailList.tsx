import React from 'react';
import PropTypes from 'prop-types';

import Thumbnail from '../Thumbnail';
import ThumbnailNoImage from '../ThumbnailNoImage';
import ThumbnailTracked from '../ThumbnailTracked';
import * as Types from '../../types';

const ThumbnailList = ({
  thumbnails,
  onThumbnailClick,
  onThumbnailDoubleClick,
  onClickUntrack,
  activeDisplaySetInstanceUIDs = [],
}) => {
  return (
    <div
      id="ohif-thumbnail-list"
      className="py-3 bg-black overflow-y-hidden ohif-scrollbar study-min-height"
    >
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
          countIcon,
          viewportIdentificator,
          isTracked,
          canReject,
          onReject,
          imageSrc,
          imageAltText,
        }) => {
          const isActive = activeDisplaySetInstanceUIDs.includes(
            displaySetInstanceUID
          );
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
                  countIcon={countIcon}
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
                  countIcon={countIcon}
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
      seriesNumber: Types.StringNumber,
      numInstances: PropTypes.number,
      description: PropTypes.string,
      componentType: Types.ThumbnailType.isRequired,
      viewportIdentificator: Types.StringArray,
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
  activeDisplaySetInstanceUIDs: PropTypes.arrayOf(PropTypes.string),
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
  SEG: 'Segmentation',
  RT: 'RT Structure Set',
};

export default ThumbnailList;
