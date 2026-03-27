import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDrag } from 'react-dnd';
import imageNotFoundSrc from '../Icons/Sources/ImageNotFound.svg';
import { Icons } from '../Icons';
import { DisplaySetMessageListTooltip } from '../DisplaySetMessageListTooltip';
import { TooltipTrigger, TooltipContent, Tooltip } from '../Tooltip';

const getModalityBg = (mod: string): string => {
  const m = (mod || '').trim().toUpperCase();
  if (m === 'CT') return '#8b5cf6';
  if (m === 'XR' || m === 'CR' || m === 'DX') return '#ec4899';
  if (m === 'MR') return '#3b82f6';
  if (m === 'US') return '#10b981';
  if (m === 'PT' || m === 'PET') return '#f59e0b';
  if (m === 'NM') return '#f97316';
  if (m === 'MG') return '#14b8a6';
  if (m === 'SR') return '#a78bfa';
  return '#6b7280';
};

/**
 * Display a thumbnail for a display set.
 */
const Thumbnail = ({
  displaySetInstanceUID,
  className,
  imageSrc,
  imageAltText,
  description,
  seriesNumber,
  numInstances,
  loadingProgress,
  countIcon,
  messages,
  isActive,
  onClick,
  onDoubleClick,
  thumbnailType,
  modality,
  viewPreset = 'thumbnails',
  isHydratedForDerivedDisplaySet = false,
  isTracked = false,
  canReject = false,
  dragData = {},
  onReject = () => {},
  onClickUntrack = () => {},
  ThumbnailMenuItems = () => {},
  isFirstInList = false,
}: withAppTypes): React.ReactNode => {
  // TODO: We should wrap our thumbnail to create a "DraggableThumbnail", as
  // this will still allow for "drag", even if there is no drop target for the
  // specified item.
  const [collectedProps, drag, dragPreview] = useDrag({
    type: 'displayset',
    item: { ...dragData },
    canDrag: function (monitor) {
      return Object.keys(dragData).length !== 0;
    },
  });

  const [lastTap, setLastTap] = useState(0);

  const handleTouchEnd = e => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      onDoubleClick(e);
    } else {
      onClick(e);
    }
    setLastTap(currentTime);
  };

  const renderThumbnailPreset = () => {
    const modalityDisplay =
      modality && modality.length > 6 ? modality.slice(0, 5) + '.' : modality;
    const modalityTruncated = modality && modality.length > 6;

    const modalityBadge = isActive ? (
      <div
        className={classnames(
          'flex items-center justify-center rounded-[2px] px-[4px] py-[3px] text-[12px] font-medium leading-none',
          modalityTruncated && 'cursor-pointer',
          'bg-[#CACACA] text-[#393939]'
        )}
        data-cy="series-modality-label"
      >
        {modalityDisplay}
      </div>
    ) : (
      <div
        className={classnames(
          'flex items-center justify-center rounded-[2px] px-[4px] py-[3px] text-[12px] font-medium leading-none text-white',
          modalityTruncated && 'cursor-pointer'
        )}
        style={{ backgroundColor: getModalityBg(modality) }}
        data-cy="series-modality-label"
      >
        {modalityDisplay}
      </div>
    );

    return (
      <div className="flex h-full w-full flex-col overflow-hidden rounded">
        {/* Image — pleine largeur, sans padding */}
        <div className="relative h-[76px] w-[104px] shrink-0 overflow-hidden">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAltText}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          ) : thumbnailType === 'thumbnailNoImage' ? (
            <img
              src={imageNotFoundSrc}
              alt="Image indisponible"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="bg-background h-full w-full" />
          )}

          {/* top left — modality badge */}
          <div className="absolute top-0 left-0 p-[4px]">
            {modalityTruncated ? (
              <Tooltip>
                <TooltipTrigger asChild>{modalityBadge}</TooltipTrigger>
                <TooltipContent side="bottom">{modality}</TooltipContent>
              </Tooltip>
            ) : (
              modalityBadge
            )}
          </div>

          {/* bottom left — numInstances overlay */}
          <div className="absolute bottom-0 left-0 p-[4px]">
            <div className="flex items-center gap-[3px] rounded-[2px] bg-black/60 px-[5px] py-[2px]">
              {countIcon ? (
                React.createElement(Icons[countIcon] || Icons.MissingIcon, {
                  className: 'w-3 text-[#B9B9B9]',
                })
              ) : (
                <Icons.InfoSeries className="w-3 text-[#B9B9B9]" />
              )}
              <span className="text-[10px] font-medium text-white">{numInstances}</span>
            </div>
          </div>

          {/* top right */}
          <div className="absolute top-0 right-0 flex items-center gap-[4px]">
            <DisplaySetMessageListTooltip
              messages={messages}
              id={`display-set-tooltip-${displaySetInstanceUID}`}
            />
            {isTracked && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="group">
                    <Icons.StatusTracking className="text-primary-light h-[15px] w-[15px] group-hover:hidden" />
                    <Icons.Cancel
                      className="text-primary-light hidden h-[15px] w-[15px] group-hover:block"
                      onClick={onClickUntrack}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="flex flex-1 flex-row">
                    <div className="flex-2 flex items-center justify-center pr-4">
                      <Icons.InfoLink className="text-primary" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span>
                        <span className="text-white">
                          {isTracked ? 'Series is tracked' : 'Series is untracked'}
                        </span>
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* bottom right */}
          <div className="absolute bottom-0 right-0 flex items-center gap-[4px] p-[4px]">
            <ThumbnailMenuItems
              displaySetInstanceUID={displaySetInstanceUID}
              canReject={canReject}
              onReject={onReject}
            />
          </div>
        </div>

        {/* Zone texte */}
        <div className="flex shrink-0 flex-col justify-start px-[6px] py-[4px]">
          <Tooltip>
            <TooltipContent>{description}</TooltipContent>
            <TooltipTrigger>
              <div
                className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-left text-[11px] font-medium leading-tight text-white"
                data-cy="series-description-label"
              >
                {description || 'Non défini.'}
              </div>
            </TooltipTrigger>
          </Tooltip>
          <div className="mt-[2px] text-[11px] text-[#B9B9B9]">
            S: {seriesNumber}
          </div>
        </div>
      </div>
    );
  };

  const renderListPreset = () => {
    const listModalityDisplay =
      modality && modality.length > 6 ? modality.slice(0, 5) + '.' : modality;
    const listModalityTruncated = modality && modality.length > 6;

    const listModalityBadge = (
      <div
        className={classnames(
          "inline-flex shrink-0 items-center rounded px-1 py-[2px] font-['Inter'] text-[11px] font-semibold uppercase leading-tight",
          isActive ? 'bg-[#CACACA] text-[#393939]' : 'text-white',
          listModalityTruncated && !isActive && 'cursor-pointer'
        )}
        style={!isActive ? { backgroundColor: getModalityBg(modality) } : undefined}
        data-cy="series-modality-label"
      >
        {listModalityDisplay}
      </div>
    );

    return (
      <div className="relative flex w-full items-center overflow-hidden py-[5px] pl-[14px] pr-[8px]">
        {/* Barre colorée absolue collée à gauche */}
        <div
          className={classnames(
            'absolute left-0 top-0 bottom-0 w-[3px] rounded-full',
            isActive || isHydratedForDerivedDisplaySet ? 'bg-highlight' : 'bg-[#B9B9B9]',
            loadingProgress && loadingProgress < 1 && 'bg-primary/25'
          )}
        />
        {/* Badge modalité */}
        <div className="mr-[8px] shrink-0">
          {listModalityTruncated ? (
            <Tooltip>
              <TooltipTrigger asChild>{listModalityBadge}</TooltipTrigger>
              <TooltipContent side="right">{modality}</TooltipContent>
            </Tooltip>
          ) : (
            listModalityBadge
          )}
        </div>
        {/* Contenu sur une seule ligne */}
        <div className="flex min-w-0 flex-1 items-center overflow-hidden">
          <Tooltip>
            <TooltipContent>{description}</TooltipContent>
            <TooltipTrigger asChild>
              <span
                className="min-w-0 max-w-[51%] shrink overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-semibold text-white"
                data-cy="series-description-label"
              >
                {description || 'Non défini.'}
              </span>
            </TooltipTrigger>
          </Tooltip>
          <span className="mx-[6px] shrink-0 text-[20px] leading-none text-white">·</span>
          <span className="shrink-0 whitespace-nowrap text-[12px] text-[#BEBEBE]">
            S: {seriesNumber}
          </span>
          <span className="mx-[6px] shrink-0 text-[20px] leading-none text-white">·</span>
          <div className="flex shrink-0 items-center gap-[3px] text-[12px] text-[#BEBEBE]">
            <span>{numInstances}</span>
            {countIcon ? (
              React.createElement(Icons[countIcon] || Icons.MissingIcon, {
                className: 'w-3 text-[#BEBEBE]',
              })
            ) : (
              <Icons.InfoSeries className="w-3 text-[#BEBEBE]" />
            )}
          </div>
        </div>
        {/* Actions droite */}
        <div className="flex shrink-0 items-center gap-[4px]">
          <DisplaySetMessageListTooltip
            messages={messages}
            id={`display-set-tooltip-${displaySetInstanceUID}`}
          />
          {isTracked && (
            <Tooltip>
              <TooltipTrigger>
                <div className="group">
                  <Icons.StatusTracking className="text-primary-light h-[20px] w-[15px] group-hover:hidden" />
                  <Icons.Cancel
                    className="text-primary-light hidden h-[15px] w-[15px] group-hover:block"
                    onClick={onClickUntrack}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="flex flex-1 flex-row">
                  <div className="flex-2 flex items-center justify-center pr-4">
                    <Icons.InfoLink className="text-primary" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span>
                      <span className="text-white">
                        {isTracked ? 'Series is tracked' : 'Series is untracked'}
                      </span>
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
          <ThumbnailMenuItems
            displaySetInstanceUID={displaySetInstanceUID}
            canReject={canReject}
            onReject={onReject}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className={classnames(
        className,
        'group flex cursor-pointer select-none flex-col rounded outline-none',
        isActive ? 'bg-[#0076F7]' : 'bg-[#5C5C5C] hover:brightness-110',
        viewPreset === 'thumbnails' && 'h-[124px] w-[104px]',
        viewPreset === 'list' && 'w-full overflow-hidden'
      )}
      id={`thumbnail-${displaySetInstanceUID}`}
      data-cy={
        thumbnailType === 'thumbnailNoImage'
          ? 'study-browser-thumbnail-no-image'
          : 'study-browser-thumbnail'
      }
      data-series={seriesNumber}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onTouchEnd={handleTouchEnd}
      role="button"
    >
      <div
        ref={drag}
        className="h-full w-full"
      >
        {viewPreset === 'thumbnails' && renderThumbnailPreset()}
        {viewPreset === 'list' && renderListPreset()}
      </div>
    </div>
  );
};

Thumbnail.propTypes = {
  displaySetInstanceUID: PropTypes.string.isRequired,
  className: PropTypes.string,
  imageSrc: PropTypes.string,
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
  imageAltText: PropTypes.string,
  description: PropTypes.string.isRequired,
  seriesNumber: PropTypes.any,
  numInstances: PropTypes.number.isRequired,
  loadingProgress: PropTypes.number,
  messages: PropTypes.object,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  onDoubleClick: PropTypes.func.isRequired,
  viewPreset: PropTypes.string,
  modality: PropTypes.string,
  isHydratedForDerivedDisplaySet: PropTypes.bool,
  isTracked: PropTypes.bool,
  onClickUntrack: PropTypes.func,
  countIcon: PropTypes.string,
  thumbnailType: PropTypes.oneOf(['thumbnail', 'thumbnailTracked', 'thumbnailNoImage']),
  isFirstInList: PropTypes.bool,
};

export { Thumbnail };
