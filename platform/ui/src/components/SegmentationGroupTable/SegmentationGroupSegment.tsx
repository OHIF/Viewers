import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Icon from '../Icon';

const SegmentItem = ({
  segmentIndex,
  segmentationId,
  label,
  isActive = false,
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
  displayText,
}) => {
  const [isNumberBoxHovering, setIsNumberBoxHovering] = useState(false);

  const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;

  return (
    <div
      className={classnames(
        'text-aqua-pale group/row bg-primary-dark flex min-h-[28px] flex-col overflow-hidden',
        {
          'bg-primary-light border-primary-light rounded-l-[6px] border text-black': isActive,
        }
      )}
      onClick={e => {
        e.stopPropagation();
        onClick(segmentationId, segmentIndex);
      }}
      tabIndex={0}
      data-cy={'segment-item'}
    >
      <div className="flex min-h-[28px]">
        <div
          className={classnames('group/number grid w-[28px] place-items-center', {
            'bg-primary-light border-primary-light rounded-l-[4px] border text-black': isActive,
            'bg-primary-dark border-primary-dark border': !isActive,
          })}
          onMouseEnter={() => setIsNumberBoxHovering(true)}
          onMouseLeave={() => setIsNumberBoxHovering(false)}
        >
          {isNumberBoxHovering && showDelete ? (
            <Icon
              name="close"
              className={classnames('h-[8px] w-[8px]', {
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
          className={classnames('text-aqua-pale relative flex w-full', {
            'border border-l-0 border-transparent': !isActive,
          })}
          style={{
            width: 'calc(100% - 28px)',
          }}
        >
          <div className="bg-primary-dark flex h-full flex-grow items-center">
            <div className="pl-2 pr-1.5">
              <div
                className={classnames('h-[8px] w-[8px] grow-0 rounded-full', {
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
            <div className="flex items-center py-1 hover:cursor-pointer">{label}</div>
          </div>
          <div
            className={classnames(
              'absolute right-[8px] top-0 flex flex-row-reverse rounded-lg pt-[3px]',
              {}
            )}
          >
            <div className="group-hover/row:hidden">
              {!isVisible && (
                <Icon
                  name="row-hidden"
                  className="h-5 w-5 text-[#3d5871]"
                  onClick={e => {
                    e.stopPropagation();
                    onToggleVisibility(segmentationId, segmentIndex);
                  }}
                />
              )}
            </div>

            {/* Icon for 'row-lock' that shows when NOT hovering and 'isLocked' is true */}
            <div className="group-hover/row:hidden">
              {isLocked && (
                <div className="flex">
                  <Icon
                    name="row-lock"
                    className="h-5 w-5 text-[#3d5871]"
                    onClick={e => {
                      e.stopPropagation();
                      onToggleLocked(segmentationId, segmentIndex);
                    }}
                  />

                  {/* This icon is visible when 'isVisible' is true */}
                  {isVisible && (
                    <Icon
                      name="row-hidden"
                      className="h-5 w-5 opacity-0"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Icons that show only when hovering */}
            <div className="hidden group-hover/row:flex">
              <HoveringIcons
                disableEditing={disableEditing}
                onEdit={onEdit}
                isLocked={isLocked}
                isVisible={isVisible}
                onToggleLocked={onToggleLocked}
                onToggleVisibility={onToggleVisibility}
                segmentationId={segmentationId}
                segmentIndex={segmentIndex}
              />
            </div>
          </div>
        </div>
      </div>
      {Array.isArray(displayText) ? (
        <div className="flex flex-col bg-black py-[5px] pl-[43px]">
          {displayText.map(text => (
            <div
              key={text}
              className="text-aqua-pale flex h-full items-center text-[11px]"
            >
              {text}
            </div>
          ))}
        </div>
      ) : (
        displayText && (
          <div className="text-aqua-pale flex h-full items-center px-2 py-[5px] pl-[45px] text-[11px]">
            {displayText}
          </div>
        )
      )}
    </div>
  );
};

const HoveringIcons = ({
  disableEditing,
  onEdit,
  isLocked,
  isVisible,
  onToggleLocked,
  onToggleVisibility,
  segmentationId,
  segmentIndex,
}) => {
  const iconClass = 'w-5 h-5 hover:cursor-pointer hover:opacity-60';

  const handleIconClick = (e, action) => {
    e.stopPropagation();
    action(segmentationId, segmentIndex);
  };

  const createIcon = (name, action, color = null) => (
    <Icon
      name={name}
      className={classnames(iconClass, color ?? 'text-white')}
      onClick={e => handleIconClick(e, action)}
    />
  );

  return (
    <div className="flex items-center">
      {!disableEditing && createIcon('row-edit', onEdit)}
      {!disableEditing &&
        createIcon(
          isLocked ? 'row-lock' : 'row-unlock',
          onToggleLocked,
          isLocked ? 'text-[#3d5871]' : null
        )}
      {createIcon(
        isVisible ? 'row-shown' : 'row-hidden',
        onToggleVisibility,
        !isVisible ? 'text-[#3d5871]' : null
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
  displayText: PropTypes.string,
};

export default SegmentItem;
