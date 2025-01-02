import React from 'react';
import PropTypes from 'prop-types';

import { OHIFThumbnail } from './OHIFThumbnail';

export function OHIFThumbnailList({
  thumbnails,
  onThumbnailClick,
  onThumbnailDoubleClick,
  onClickUntrack,
  activeDisplaySetInstanceUIDs = [],
  viewPreset,
  onThumbnailContextMenu,
}: withAppTypes) {
  return (
    <div
      className="min-h-[350px]"
      style={{
        '--radix-accordion-content-height': '350px',
      }}
    >
      <div
        id="ohif-thumbnail-list"
        className={`ohif-scrollbar bg-bkg-low grid place-items-center overflow-y-hidden pt-[4px] pr-[2.5px] pl-[2.5px] ${
          viewPreset === 'thumbnails' ? 'grid-cols-2 gap-[4px] pb-[12px]' : 'grid-cols-1 gap-[2px]'
        }`}
      >
        {thumbnails.map(
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
            isTracked,
            canReject,
            onReject,
            imageSrc,
            messages,
            imageAltText,
            isHydratedForDerivedDisplaySet,
          }) => {
            const isActive = activeDisplaySetInstanceUIDs.includes(displaySetInstanceUID);
            return (
              <OHIFThumbnail
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
                modality={modality}
                viewPreset={componentType === 'thumbnailNoImage' ? 'list' : viewPreset}
                thumbnailType={componentType}
                onClick={() => onThumbnailClick(displaySetInstanceUID)}
                onDoubleClick={() => onThumbnailDoubleClick(displaySetInstanceUID)}
                isTracked={isTracked}
                loadingProgress={loadingProgress}
                onClickUntrack={() => onClickUntrack(displaySetInstanceUID)}
                isHydratedForDerivedDisplaySet={isHydratedForDerivedDisplaySet}
                canReject={canReject}
                onReject={onReject}
                onThumbnailContextMenu={onThumbnailContextMenu}
              />
            );
          }
        )}
      </div>
    </div>
  );
}

OHIFThumbnailList.propTypes = {
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