import React from 'react';

import { Thumbnail } from '../Thumbnail';
import { useDynamicMaxHeight } from '../../hooks/useDynamicMaxHeight';

interface ThumbnailListProps {
  thumbnails?: {
    displaySetInstanceUID: string;
    imageSrc?: string;
    imageAltText?: string;
    seriesDate?: string;
    seriesNumber?: any;
    numInstances?: number;
    description?: string;
    componentType?: any;
    isTracked?: boolean;
    /**
     * Data the thumbnail should expose to a receiving drop target. Use a matching
     * `dragData.type` to identify which targets can receive this draggable item.
     * If this is not set, drag-n-drop will be disabled for this thumbnail.
     *
     * Ref: https://react-dnd.github.io/react-dnd/docs/api/use-drag#specification-object-members
     */
    dragData?: {
      /** Must match the "type" a dropTarget expects */
      type: string;
    };
  }[];
  activeDisplaySetInstanceUIDs?: string[];
  onThumbnailClick(...args: unknown[]): unknown;
  onThumbnailDoubleClick(...args: unknown[]): unknown;
  onClickUntrack(...args: unknown[]): unknown;
  viewPreset?: string;
  ThumbnailMenuItems?: any;
}

const ThumbnailList = ({
  thumbnails,
  onThumbnailClick,
  onThumbnailDoubleClick,
  onClickUntrack,
  activeDisplaySetInstanceUIDs = [],
  viewPreset,
  ThumbnailMenuItems
}: ThumbnailListProps) => {
  // Use the dynamic height hook on the parent container
  const { ref, maxHeight } = useDynamicMaxHeight(thumbnails);

  // Filter thumbnails into list items and thumbnail items
  const listItems = thumbnails?.filter(
    ({ componentType }) => componentType === 'thumbnailNoImage' || viewPreset === 'list'
  );

  const thumbnailItems = thumbnails?.filter(
    ({ componentType }) => componentType !== 'thumbnailNoImage' && viewPreset === 'thumbnails'
  );

  return (
    <div className="flex flex-col">
      <div
        ref={ref}
        className="flex flex-col gap-[2px] pt-[4px] pr-[2.5px] pl-[5px] pb-[4px]"
      >
        {thumbnailItems.length > 0 && (
          <div
            id="ohif-thumbnail-list"
            className="bg-bkg-low grid grid-cols-[repeat(auto-fit,_minmax(0,135px))] place-items-start gap-[4px]"
          >
            {thumbnailItems.map(item => {
              const { displaySetInstanceUID, componentType, numInstances, ...rest } = item;

              const isActive = activeDisplaySetInstanceUIDs.includes(displaySetInstanceUID);
              return (
                <Thumbnail
                  key={displaySetInstanceUID}
                  {...rest}
                  displaySetInstanceUID={displaySetInstanceUID}
                  numInstances={numInstances || 1}
                  isActive={isActive}
                  thumbnailType={componentType}
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
            className="bg-bkg-low grid grid-cols-[repeat(auto-fit,_minmax(0,275px))] place-items-start gap-[2px]"
          >
            {listItems.map(item => {
              const { displaySetInstanceUID, componentType, numInstances, ...rest } = item;
              const isActive = activeDisplaySetInstanceUIDs.includes(displaySetInstanceUID);
              return (
                <Thumbnail
                  key={displaySetInstanceUID}
                  {...rest}
                  displaySetInstanceUID={displaySetInstanceUID}
                  numInstances={numInstances || 1}
                  isActive={isActive}
                  thumbnailType={componentType}
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
    </div>
  );
};

export { ThumbnailList };
