import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Icon from '../Icon';

const SegmentationItem = ({
  id,
  index,
  label,
  displayText = [],
  isActive = false,
  isVisible,
  onClick,
  onEdit,
  onDelete,
  toggleVisibility,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const onEditHandler = event => {
    event.stopPropagation();
    onEdit({ id, isActive, event });
  };

  const onClickHandler = event => onClick({ id, isActive, event });

  const onMouseEnter = () => setIsHovering(true);
  const onMouseLeave = () => setIsHovering(false);

  return (
    <div
      className={classnames(
        'group relative flex cursor-pointer items-stretch border border-transparent bg-black outline-none transition duration-300',
        {
          'border-primary-light overflow-hidden rounded': isActive,
        }
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClickHandler}
      role="button"
      tabIndex="0"
      data-cy={'measurement-item'}
    >
      <div
        className={classnames(
          'flex h-auto w-6 items-center justify-center text-center text-base transition duration-300',
          {
            'bg-primary-light text-black': isActive,
            'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
          }
        )}
      >
        {isHovering ? (
          <Icon
            name="close"
            className={classnames('w-[10px] text-center transition duration-500 hover:opacity-80', {
              'bg-primary-light text-black': isActive,
              'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
            })}
            onClick={e => {
              e.stopPropagation();
              onDelete(id);
            }}
          />
        ) : (
          <span>{index}</span>
        )}
      </div>
      <div className="relative flex w-full flex-col p-1">
        <div className="ml-2 flex items-center">
          <div className="text-primary-light flex flex-1 text-base">
            <div
              className="mt-1 mr-2 h-3 w-3 rounded-full"
              style={{ backgroundColor: 'red' }}
            ></div>
            {label}
          </div>
          <div className="flex w-1/4 items-center">
            <div>
              <Icon
                className={classnames(
                  'absolute w-3 cursor-pointer text-white transition duration-300 hover:opacity-80',
                  { 'invisible mr-2 opacity-0': !isActive && !isHovering },
                  { 'opacity-1 visible': !isActive && isHovering }
                )}
                name="pencil"
                style={{
                  top: 7,
                  right: 14,
                  transform: isActive || isHovering ? '' : 'translateX(100%)',
                }}
                onClick={e => onEditHandler(e)}
              />
            </div>
            <div>
              <Icon
                className={classnames(
                  'w-4 cursor-pointer text-white transition duration-300 hover:opacity-80'
                )}
                name={isVisible ? 'eye-visible' : 'eye-hidden'}
                onClick={e => {
                  // stopPropagation needed to avoid disable the current active item
                  e.stopPropagation();
                  toggleVisibility(e, id);
                }}
              />
            </div>
          </div>
        </div>
        <div className="ml-3">
          {displayText &&
            displayText.map(line => (
              <span
                key={line}
                className="border-primary-light border-l pl-2 text-base text-white"
              >
                {line}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

SegmentationItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.number.isRequired, PropTypes.string.isRequired]),
  index: PropTypes.number.isRequired,
  label: PropTypes.string,
  displayText: PropTypes.arrayOf(PropTypes.string),
  isActive: PropTypes.bool,
  isVisible: PropTypes.bool,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  toggleVisibility: PropTypes.func,
};

export default SegmentationItem;
