import React from 'react';
import PropTypes from 'prop-types';

import { Thumbnail } from '../Thumbnail';

const ThumbnailList = ({
  thumbnails,
  onThumbnailClick,
  onThumbnailDoubleClick,
  onClickUntrack,
  activeDisplaySetInstanceUIDs = [],
  viewPreset,
  ThumbnailMenuItems,
}) => {
  // Filter thumbnails into list items and thumbnail items
  const listItems = thumbnails.filter(
    ({ componentType }) => componentType === 'thumbnailNoImage' || viewPreset === 'list'
  );

  const thumbnailItems = thumbnails.filter(
    ({ componentType }) => componentType !== 'thumbnailNoImage' && viewPreset === 'thumbnails'
  );

  return (
    <div
      className="min-h-[350px]"
      style={{
        '--radix-accordion-content-height': '350px',
      }}
    >
      {/* Thumbnail Items */}
      <div
        id="ohif-thumbnail-list"
        className="ohif-scrollbar bg-bkg-low grid grid-cols-[repeat(auto-fit,_minmax(0,135px))] place-items-start gap-[4px] overflow-y-hidden pt-[4px] pr-[2.5px] pl-[5px]"
      >
        {thumbnailItems.map(
          ({
            displaySetInstanceUID,
            description,
            dragData,
            seriesNumber,
            numInstances,
            loadingProgress,
            modality,
            componentType,
            countIcon,
            canReject,
            onReject,
            isTracked,
            imageSrc,
            messages,
            imageAltText,
            isHydratedForDerivedDisplaySet,
          }) => {
            const isActive = activeDisplaySetInstanceUIDs.includes(displaySetInstanceUID);
            return (
              <Thumbnail
                key={displaySetInstanceUID}
                displaySetInstanceUID={displaySetInstanceUID}
                dragData={dragData}
                description={description}
                seriesNumber={seriesNumber}
                numInstances={numInstances || 1}
                countIcon={countIcon}
                imageSrc={imageSrc}
                imageAltText={imageAltText}
                messages={messages}
                isActive={isActive}
                canReject={canReject}
                onReject={onReject}
                modality={modality}
                viewPreset="thumbnails"
                thumbnailType={componentType}
                onClick={() => onThumbnailClick(displaySetInstanceUID)}
                onDoubleClick={() => onThumbnailDoubleClick(displaySetInstanceUID)}
                isTracked={isTracked}
                loadingProgress={loadingProgress}
                onClickUntrack={() => onClickUntrack(displaySetInstanceUID)}
                isHydratedForDerivedDisplaySet={isHydratedForDerivedDisplaySet}
                ThumbnailMenuItems={ThumbnailMenuItems}
              />
            );
          }
        )}
      </div>

      {/* List Items */}
      <div
        id="ohif-thumbnail-list"
        className="ohif-scrollbar bg-bkg-low grid grid-cols-[repeat(auto-fit,_minmax(0,275px))] place-items-start gap-[2px] overflow-y-hidden pt-[4px] pr-[2.5px] pl-[5px]"
      >
        {listItems.map(
          ({
            displaySetInstanceUID,
            description,
            dragData,
            seriesNumber,
            numInstances,
            loadingProgress,
            modality,
            componentType,
            countIcon,
            canReject,
            onReject,
            isTracked,
            imageSrc,
            messages,
            imageAltText,
            isHydratedForDerivedDisplaySet,
          }) => {
            const isActive = activeDisplaySetInstanceUIDs.includes(displaySetInstanceUID);
            return (
              <Thumbnail
                key={displaySetInstanceUID}
                displaySetInstanceUID={displaySetInstanceUID}
                dragData={dragData}
                description={description}
                seriesNumber={seriesNumber}
                numInstances={numInstances || 1}
                countIcon={countIcon}
                imageSrc={imageSrc}
                imageAltText={imageAltText}
                messages={messages}
                isActive={isActive}
                canReject={canReject}
                onReject={onReject}
                modality={modality}
                viewPreset="list"
                thumbnailType={componentType}
                onClick={() => onThumbnailClick(displaySetInstanceUID)}
                onDoubleClick={() => onThumbnailDoubleClick(displaySetInstanceUID)}
                isTracked={isTracked}
                loadingProgress={loadingProgress}
                onClickUntrack={() => onClickUntrack(displaySetInstanceUID)}
                isHydratedForDerivedDisplaySet={isHydratedForDerivedDisplaySet}
                ThumbnailMenuItems={ThumbnailMenuItems}
              />
            );
          }
        )}
      </div>
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
      seriesNumber: PropTypes.any,
      numInstances: PropTypes.number,
      description: PropTypes.string,
      componentType: PropTypes.any,
      isTracked: PropTypes.bool,
      dragData: PropTypes.shape({
        type: PropTypes.string.isRequired,
      }),
    })
  ),
  activeDisplaySetInstanceUIDs: PropTypes.arrayOf(PropTypes.string),
  onThumbnailClick: PropTypes.func.isRequired,
  onThumbnailDoubleClick: PropTypes.func.isRequired,
  onClickUntrack: PropTypes.func.isRequired,
  viewPreset: PropTypes.string,
};

export { ThumbnailList };
