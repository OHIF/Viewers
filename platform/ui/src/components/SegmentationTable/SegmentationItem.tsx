import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Icon from '../Icon';

const SegmentationItem = ({
  id,
  index,
  label,
  displayText,
  isActive,
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
        'group relative flex cursor-pointer items-stretch bg-black border outline-none border-transparent transition duration-300',
        {
          'rounded overflow-hidden border-primary-light': isActive,
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
              'w-[10px] transition duration-500 text-center hover:opacity-80',
              {
                'bg-primary-light text-black': isActive,
                'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
              }
            )}
            onClick={e => {
              e.stopPropagation();
              onDelete(id);
            }}
          />
        ) : (
          <span>{index}</span>
        )}
      </div>
      <div className="relative flex flex-col w-full p-1">
        <div className="flex items-center ml-2">
          <div className="flex flex-1 text-base text-primary-light">
            <div
              className="w-3 h-3 mt-1 mr-2 rounded-full"
              style={{ backgroundColor: 'red' }}
            ></div>
            {label}
          </div>
          <div className="flex items-center w-1/4">
            <div>
              <Icon
                className={classnames(
                  'text-white w-3 absolute cursor-pointer transition duration-300 hover:opacity-80',
                  { 'invisible opacity-0 mr-2': !isActive && !isHovering },
                  { 'visible opacity-1': !isActive && isHovering }
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
                  'text-white w-4 cursor-pointer transition duration-300 hover:opacity-80'
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
                className="pl-2 text-base text-white border-l border-primary-light"
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
  id: PropTypes.oneOfType([
    PropTypes.number.isRequired,
    PropTypes.string.isRequired,
  ]),
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

SegmentationItem.defaultProps = {
  isActive: false,
  displayText: [],
};

export default SegmentationItem;
