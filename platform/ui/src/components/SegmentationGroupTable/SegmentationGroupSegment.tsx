import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Icon from '../Icon';

const SegmentItem = ({
  segmentIndex,
  segmentationId,
  label,
  isActive,
  isVisible,
  color,
  showSegmentDelete,
  disableEditing,
  isLocked = false,
  onClick,
  onEdit,
  onDelete,
  onColor,
  onToggleVisibility,
  onToggleLocked,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isSegmentIndexHovering, setIsSegmentIndexHovering] = useState(false);

  const onMouseEnter = () => setIsHovering(true);
  const onMouseLeave = () => setIsHovering(false);

  const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;

  return (
    <div
      className={classnames(
        'bg-primary-dark group relative flex cursor-pointer overflow-hidden border text-[12px] transition duration-300',
        {
          'border-primary-light rounded-[3px]': isActive,
        },
        {
          'border-transparent': !isActive,
        }
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={e => {
        e.stopPropagation();
        onClick(segmentationId, segmentIndex);
      }}
      role="button"
      tabIndex={0}
      data-cy={'segment-item'}
    >
      <div
        className={classnames(
          'flex w-[27px] items-center justify-center border-r border-r-black text-[12px]',
          {
            'bg-primary-light border-l-primary-light rounded-l-sm border-l text-black': isActive,
            'rounded-l-sm  border-l border-l-[#1d3c58] bg-[#1d3c58]': !isActive && isHovering,
            'bg-primary-dark text-aqua-pale': !isActive && !isHovering && isVisible,
            'bg-[#140e2e] text-[#537594] opacity-60': !isActive && !isVisible,
          }
        )}
        onMouseEnter={() => setIsSegmentIndexHovering(true)}
        onMouseLeave={() => setIsSegmentIndexHovering(false)}
      >
        {isSegmentIndexHovering && showSegmentDelete ? (
          <Icon
            name="close"
            className={classnames('pr-0.5')}
            onClick={e => {
              e.stopPropagation();
              onDelete(segmentationId, segmentIndex);
            }}
          />
        ) : (
          <div className={classnames('flex items-center pr-2 ')}>{segmentIndex}</div>
        )}
      </div>
      <div
        className={classnames(
          'relative flex w-full items-center justify-between border-r border-r-black py-1 pl-2 text-white ',
          {
            'bg-primary-dark text-primary-light': isActive,
            'bg-primary-dark text-aqua-pale': !isActive && isVisible,
            'bg-[#140e2e] text-[#3d5871] opacity-60': !isVisible,
          }
        )}
      >
        <div className={classnames('flex items-baseline gap-2')}>
          <div
            className={classnames('h-[8px] w-[8px] shrink-0 rounded-full')}
            style={{ backgroundColor: cssColor }}
            onClick={e => {
              e.stopPropagation();
              onColor(segmentationId, segmentIndex);
            }}
          />
          <div className="">{label}</div>
        </div>
        {/* with faded background */}
        <div className="bg-black/15 absolute right-0 rounded-lg pr-[7px]">
          {!isVisible && !isHovering && (
            <div>
              <Icon
                name="row-hidden"
                className={classnames('h-5 w-5 text-[#3d5871] ')}
                onClick={e => {
                  e.stopPropagation();
                  onToggleVisibility(segmentationId, segmentIndex);
                }}
              />
            </div>
          )}
          {isHovering && (
            <div className={classnames('flex items-center')}>
              {!disableEditing && (
                <Icon
                  name="row-edit"
                  className={classnames('h-5 w-5', {
                    'text-white': isLocked,
                    'text-primary-light': !isLocked,
                  })}
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(segmentationId, segmentIndex);
                  }}
                />
              )}
              {isVisible ? (
                <Icon
                  name="row-hide"
                  className={classnames('h-5 w-5', {
                    'text-white': isLocked,
                    'text-primary-light': !isLocked,
                  })}
                  onClick={e => {
                    e.stopPropagation();
                    onToggleVisibility(segmentationId, segmentIndex);
                  }}
                />
              ) : (
                <Icon
                  name="row-unhide"
                  className={classnames('h-5 w-5', {
                    'text-white': isLocked,
                    'text-primary-light': !isLocked,
                  })}
                  onClick={e => {
                    e.stopPropagation();
                    onToggleVisibility(segmentationId, segmentIndex);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
      {/* <div className="relative flex flex-col w-full border-t border-t-black">
        <div className="fl`ex items-center mb-1 ml-2">
          <div className="flex items-center flex-1 text-base text-primary-light">
            <div
              className={classnames(
                'w-3 h-3 mt-1 mr-2 rounded-full cursor-pointer transition duration-300 hover:opacity-80'
              )}
              onClick={e => {
                e.stopPropagation();
                onColor(segmentationId, segmentIndex);
              }}
              style={{ backgroundColor: cssColor }}
            ></div>
            {label}
          </div>
          <div className="flex items-center w-1/3">
            <div className="px-1">
              <Icon
                className={classnames(
                  'text-white w-4 cursor-pointer transition duration-300 hover:opacity-80'
                )}
                name={isVisible ? 'eye-visible' : 'eye-hidden'}
                onClick={e => {
                  // stopPropagation needed to avoid disable the current active item
                  e.stopPropagation();
                  onToggleVisibility(segmentationId, segmentIndex);
                }}
              />
            </div>
            {onToggleLocked !== undefined ? (
              <div className="px-1">
                <Icon
                  className={classnames(
                    'text-white w-4 cursor-pointer transition duration-300 hover:opacity-80'
                  )}
                  name={isLocked ? 'lock' : 'dotted-circle'}
                  onClick={e => {
                    // stopPropagation needed to avoid disable the current active item
                    e.stopPropagation();
                    onToggleLocked(segmentationId, segmentIndex);
                  }}
                />
              </div>
            ) : null}
            <div className="px-1">
              <Icon
                className={classnames(
                  'text-white w-4 cursor-pointer transition duration-300 hover:opacity-80'
                )}
                name={'pencil'}
                onClick={e => {
                  // stopPropagation needed to avoid disable the current active item
                  e.stopPropagation();
                  onEdit(segmentationId, segmentIndex);
                }}
              />
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};

SegmentItem.propTypes = {
  segmentIndex: PropTypes.number.isRequired,
  segmentationId: PropTypes.string.isRequired,
  label: PropTypes.string,
  disableEditing: PropTypes.bool,
  // color as array
  color: PropTypes.array,
  isActive: PropTypes.bool.isRequired,
  isVisible: PropTypes.bool.isRequired,
  isLocked: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleVisibility: PropTypes.func.isRequired,
  onToggleLocked: PropTypes.func,
};

SegmentItem.defaultProps = {
  isActive: false,
};

export default SegmentItem;
