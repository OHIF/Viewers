import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon } from '../';

const MeasurementItem = ({ id, index, label, displayText, isActive, onClick, onEdit }) => {
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
        'group flex cursor-pointer bg-black border outline-none border-transparent transition duration-300',
        {
          'rounded overflow-hidden border-primary-light': isActive,
        }
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClickHandler}
      role="button"
      tabIndex="0"
    >
      <div
        className={classnames(
          'text-center w-6 py-1 text-base transition duration-300',
          {
            'bg-primary-light text-black': isActive,
            'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
          }
        )}
      >
        {index}
      </div>
      <div className="px-2 py-1 flex flex-1 flex-col relative">
        <span className="text-base text-primary-light mb-1">
          {label}
        </span>
        {displayText.map(line => (
          <span key={line} className="pl-2 border-l border-primary-light text-base text-white">
            {line}
          </span>
        ))}
        <Icon
          className={classnames(
            'text-white w-4 absolute cursor-pointer transition duration-300',
            { 'invisible opacity-0 mr-2': !isActive && !isHovering },
            { 'visible opacity-1': !isActive && isHovering }
          )}
          name="pencil"
          style={{
            top: 4,
            right: 4,
            transform: isActive || isHovering ? '' : 'translateX(100%)',
          }}
          onClick={onEditHandler}
        />
      </div>
    </div>
  );
};

MeasurementItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.number.isRequired, PropTypes.string.isRequired]),
  index: PropTypes.number.isRequired,
  label: PropTypes.string,
  displayText: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  onEdit: PropTypes.func
};

MeasurementItem.defaultProps = {
  isActive: false,
};

export default MeasurementItem;
