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
  showDelete,
  disableEditing,
  isLocked = false,
  onClick,
  onEdit,
  onDelete,
  onColor,
  onToggleVisibility,
  onToggleLocked,
}) => {
  const [isRowHovering, setRowIsHovering] = useState(false);
  const [isNumberBoxHovering, setIsNumberBoxHovering] = useState(false);

  const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;

  return (
    <div
      className={classnames(
        'flex text-aqua-pale bg-black group/row min-h-[28px]'
      )}
      onMouseEnter={() => setRowIsHovering(true)}
      onMouseLeave={() => setRowIsHovering(false)}
      onClick={e => {
        e.stopPropagation();
        onClick(segmentationId, segmentIndex);
      }}
      tabIndex={0}
      data-cy={'segment-item'}
    >
      <div
        className={classnames(
          'grid place-items-center w-[28px] bg-primary-dark group/number',
          {
            'bg-primary-light text-black border border-primary-light rounded-l-[4px]': isActive,
            'border border-primary-dark': !isActive,
          }
        )}
        onMouseEnter={() => setIsNumberBoxHovering(true)}
        onMouseLeave={() => setIsNumberBoxHovering(false)}
      >
        {isNumberBoxHovering && showDelete ? (
          <Icon
            name="close"
            className={classnames('w-[8px] h-[8px]', {
              'hover:cursor-pointer hover:opacity-60': !disableEditing,
            })}
            onClick={e => {
              if (disableEditing) {
                return;
              }
              e.stopPropagation();
              onDelete(segmentationId, segmentIndex);
            }}
          />
        ) : (
          <div>{segmentIndex}</div>
        )}
      </div>
      <div
        className={classnames('relative flex w-full', {
          'border border-primary-light bg-primary-dark border-l-0 rounded-r-[4px]': isActive,
          'border border-transparent border-l-0': !isActive,
        })}
      >
        <div className="flex flex-grow items-center group-hover/row:bg-primary-dark w-full h-full">
          <div className="pl-3.5 pr-2.5">
            <div
              className={classnames('grow-0 w-[8px] h-[8px] rounded-full', {
                'hover:cursor-pointer hover:opacity-60': !disableEditing,
              })}
              style={{ backgroundColor: cssColor }}
              onClick={e => {
                if (disableEditing) {
                  return;
                }
                e.stopPropagation();
                onColor(segmentationId, segmentIndex);
              }}
            />
          </div>
          <div className="flex items-center py-1 hover:cursor-pointer">
            {label}
          </div>
        </div>
        <div
          className={classnames(
            'absolute right-0 top-0 rounded-lg pr-[8px] pt-[3px] flex flex-row-reverse',
            {}
          )}
        >
          {!isVisible && !isRowHovering && (
            <div>
              <Icon
                name="row-hidden"
                className={classnames('w-5 h-5 text-[#3d5871] ')}
                onClick={e => {
                  e.stopPropagation();
                  onToggleVisibility(segmentationId, segmentIndex);
                }}
              />
            </div>
          )}
          {isLocked && !isRowHovering && (
            <div className="flex">
              <div>
                <Icon
                  name="row-locked"
                  className={classnames('w-5 h-5')}
                  onClick={e => {
                    e.stopPropagation();
                    onToggleLocked(segmentationId, segmentIndex);
                  }}
                />
              </div>
              {isVisible && (
                <div>
                  <Icon
                    name="row-hidden"
                    className={classnames('opacity-0 w-5 h-5')}
                  />
                </div>
              )}
            </div>
          )}
          {isRowHovering && (
            <HoveringIcons
              onEdit={onEdit}
              isLocked={isLocked}
              isVisible={isVisible}
              onToggleLocked={onToggleLocked}
              onToggleVisibility={onToggleVisibility}
              segmentationId={segmentationId}
              segmentIndex={segmentIndex}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const HoveringIcons = ({
  onEdit,
  isLocked,
  isVisible,
  onToggleLocked,
  onToggleVisibility,
  segmentationId,
  segmentIndex,
}) => {
  return (
    <div className={classnames('flex items-center')}>
      <Icon
        name="row-edit"
        className={'w-5 h-5 hover:cursor-pointer hover:opacity-60'}
        onClick={e => {
          e.stopPropagation();
          onEdit(segmentationId, segmentIndex);
        }}
      />
      {isLocked ? (
        <Icon
          name="row-locked"
          className={classnames(
            'w-5 h-5 hover:cursor-pointer hover:opacity-60'
          )}
          onClick={e => {
            e.stopPropagation();
            onToggleLocked(segmentationId, segmentIndex);
          }}
        />
      ) : (
        <Icon
          name="row-unlocked"
          className={classnames(
            'w-5 h-5 hover:cursor-pointer hover:opacity-60'
          )}
          onClick={e => {
            e.stopPropagation();
            onToggleLocked(segmentationId, segmentIndex);
          }}
        />
      )}
      {isVisible ? (
        <Icon
          name="row-hide"
          className={classnames(
            'w-5 h-5 hover:cursor-pointer hover:opacity-60'
          )}
          onClick={e => {
            e.stopPropagation();
            onToggleVisibility(segmentationId, segmentIndex);
          }}
        />
      ) : (
        <Icon
          name="row-unhide"
          className={classnames(
            'w-5 h-5 hover:cursor-pointer hover:opacity-60'
          )}
          onClick={e => {
            e.stopPropagation();
            onToggleVisibility(segmentationId, segmentIndex);
          }}
        />
      )}
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
