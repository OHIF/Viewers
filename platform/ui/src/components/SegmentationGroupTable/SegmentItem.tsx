import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon } from '@ohif/ui';

const SegmentItem = ({
  segmentIndex,
  segmentationId,
  label,
  isActive,
  isVisible,
  color,
  isLocked = false,
  onClick,
  onEdit,
  onDelete,
  onColor,
  onToggleVisibility,
  onToggleLocked,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const onMouseEnter = () => setIsHovering(true);
  const onMouseLeave = () => setIsHovering(false);

  const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;

  return (
    <div
      className={classnames(
        'group relative flex cursor-pointer items-stretch bg-black border outline-none border-transparent transition duration-300',
        {
          'rounded overflow-hidden border-primary-light': isActive,
        }
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={e => {
        e.stopPropagation();
        onClick(segmentationId, segmentIndex);
      }}
      role="button"
      tabIndex="0"
      data-cy={'measurement-item'}
    >
      <div
        className={classnames(
          'text-center flex items-center justify-center w-6 h-auto text-base transition duration-300',
          {
            'bg-primary-light text-black': isActive,
            'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
          }
        )}
      >
        {isHovering ? (
          <Icon
            name="close"
            className={classnames(
              'w-5 transition duration-500 text-center hover:opacity-80',
              {
                'bg-primary-light text-black': isActive,
                'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
              }
            )}
            onClick={e => {
              e.stopPropagation();
              onDelete(segmentationId, segmentIndex);
            }}
          />
        ) : (
          <span>{segmentIndex}</span>
        )}
      </div>
      <div className="relative flex flex-col w-full p-1">
        <div className="flex items-center mb-1 ml-2">
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
      </div>
    </div>
  );
};

SegmentItem.propTypes = {
  segmentIndex: PropTypes.number.isRequired,
  segmentationId: PropTypes.string.isRequired,
  label: PropTypes.string,
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
