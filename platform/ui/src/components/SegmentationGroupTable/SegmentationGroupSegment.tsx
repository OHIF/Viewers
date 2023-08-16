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
      className="flex text-aqua-pale bg-black group/row min-h-[28px]"
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
        className="grid place-items-center w-[28px] bg-primary-dark group/number"
        onMouseEnter={() => setIsNumberBoxHovering(true)}
        onMouseLeave={() => setIsNumberBoxHovering(false)}
      >
        {isNumberBoxHovering && showDelete ? (
          <Icon
            name="close"
            onClick={e => {
              e.stopPropagation();
              onDelete(segmentationId, segmentIndex);
            }}
          />
        ) : (
          <div>{segmentIndex}</div>
        )}
      </div>
      <div className="relative flex w-full">
        <div className="flex flex-grow items-center group-hover/row:bg-primary-dark w-full h-full">
          <div className="pl-3 pr-2.5">
            <div
              className={classnames('grow-0 w-[8px] h-[8px] rounded-full')}
              style={{ backgroundColor: cssColor }}
              onClick={e => {
                e.stopPropagation();
                onColor(segmentationId, segmentIndex);
              }}
            />
          </div>
          <div className="flex items-center">{label}</div>
        </div>
        <div className="absolute right-0 top-1 bg-black/15 rounded-lg pr-[7px]">
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
        className={classnames('w-5 h-5', {
          'text-white': isLocked,
          'text-primary-light': !isLocked,
        })}
        onClick={e => {
          e.stopPropagation();
          onEdit(segmentationId, segmentIndex);
        }}
      />
      {isVisible ? (
        <Icon
          name="row-hide"
          className={classnames('w-5 h-5', {
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
          className={classnames('w-5 h-5', {
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
  );
};

SegmentItem.propTypes = {
  segmentIndex: PropTypes.number.isRequired,
  segmentationId: PropTypes.string.isRequired,
  label: PropTypes.string,
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
