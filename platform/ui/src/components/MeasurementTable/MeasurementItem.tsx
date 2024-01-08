import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Icon from '../Icon';

const MeasurementItem = ({
  uid,
  index,
  label,
  displayText,
  isActive,
  isLocked,
  onClick,
  onEdit,
  item,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const onEditHandler = event => {
    event.stopPropagation();
    onEdit({ uid, isActive, event });
  };

  const onClickHandler = event => onClick({ uid, isActive, event });

  const onMouseEnter = () => setIsHovering(true);
  const onMouseLeave = () => setIsHovering(false);

  return (
    <div
      className={classnames(
        'group flex cursor-pointer border border-transparent bg-black outline-none transition duration-300',
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
        className={classnames('w-6 py-1 text-center text-base transition duration-300', {
          'bg-primary-light active text-black': isActive,
          'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
        })}
      >
        {index}
      </div>
      <div className="relative flex flex-1 flex-col px-2 py-1">
        <span className="text-primary-light mb-1 text-base">{label}</span>
        {displayText.map((line, i) => (
          <span
            key={i}
            className="border-primary-light border-l pl-2 text-base text-white"
            dangerouslySetInnerHTML={{ __html: line }}
          ></span>
        ))}
        {!isLocked && (
          <Icon
            className={classnames(
              'absolute w-4 cursor-pointer text-white transition duration-300',
              { 'invisible mr-2 opacity-0': !isActive && !isHovering },
              { 'opacity-1 visible': !isActive && isHovering }
            )}
            name="pencil"
            style={{
              top: 4,
              right: 4,
              transform: isActive || isHovering ? '' : 'translateX(100%)',
            }}
            onClick={onEditHandler}
          />
        )}
      </div>
    </div>
  );
};

MeasurementItem.propTypes = {
  uid: PropTypes.oneOfType([PropTypes.number.isRequired, PropTypes.string.isRequired]),
  index: PropTypes.number.isRequired,
  label: PropTypes.string,
  displayText: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
};

MeasurementItem.defaultProps = {
  isActive: false,
};

export default MeasurementItem;
