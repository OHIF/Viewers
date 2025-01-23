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
    <div>
      {/* Thumbnail Items */}
      {thumbnailItems.length > 0 && (
        <div
          id="ohif-thumbnail-list"
          className="ohif-scrollbar bg-bkg-low grid grid-cols-[repeat(auto-fit,_minmax(0,135px))] place-items-start gap-[4px] overflow-y-hidden pt-[4px] pr-[2.5px] pl-[5px] pb-[4px]"
        >
          {thumbnailItems.map(item => {
            const { displaySetInstanceUID, numInstances, ...rest } = item;

            const isActive = activeDisplaySetInstanceUIDs.includes(displaySetInstanceUID);
            return (
              <Thumbnail
                key={displaySetInstanceUID}
                {...rest}
                displaySetInstanceUID={displaySetInstanceUID}
                numInstances={numInstances || 1}
                isActive={isActive}
                viewPreset="thumbnails"
                onClick={onThumbnailClick.bind(null, displaySetInstanceUID)}
                onDoubleClick={onThumbnailDoubleClick.bind(null, displaySetInstanceUID)}
                onClickUntrack={onClickUntrack.bind(null, displaySetInstanceUID)}
                ThumbnailMenuItems={ThumbnailMenuItems}
              />
            );
          })}
        </div>
      )}
      {/* List Items */}
      {listItems.length > 0 && (
        <div
          id="ohif-thumbnail-list"
          className="ohif-scrollbar bg-bkg-low grid grid-cols-[repeat(auto-fit,_minmax(0,275px))] place-items-start gap-[2px] overflow-y-hidden pt-[4px] pr-[2.5px] pl-[5px] pb-[4px]"
        >
          {listItems.map(item => {
            const { displaySetInstanceUID, numInstances, ...rest } = item;
            const isActive = activeDisplaySetInstanceUIDs.includes(displaySetInstanceUID);
            return (
              <Thumbnail
                key={displaySetInstanceUID}
                {...rest}
                displaySetInstanceUID={displaySetInstanceUID}
                numInstances={numInstances || 1}
                isActive={isActive}
                viewPreset="list"
                onClick={onThumbnailClick.bind(null, displaySetInstanceUID)}
                onDoubleClick={onThumbnailDoubleClick.bind(null, displaySetInstanceUID)}
                onClickUntrack={onClickUntrack.bind(null, displaySetInstanceUID)}
                ThumbnailMenuItems={ThumbnailMenuItems}
              />
            );
          })}
        </div>
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
  ThumbnailMenuItems: PropTypes.any,
};

export { ThumbnailList };
