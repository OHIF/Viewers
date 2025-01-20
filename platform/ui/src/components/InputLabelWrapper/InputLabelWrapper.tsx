import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Icon from '../Icon';

const baseLabelClassName = 'flex flex-col flex-1 text-white text-lg pl-1 select-none';
const spanClassName = 'flex flex-row items-center cursor-pointer focus:outline-none';
const sortIconMap = {
  descending: 'sorting-active-up',
  ascending: 'sorting-active-down',
  none: 'sorting',
};

const InputLabelWrapper = ({
  label,
  isSortable,
  sortDirection,
  onLabelClick,
  className = '',
  children,
}) => {
  const onClickHandler = e => {
    if (!isSortable) {
      return;
    }

    onLabelClick(e);
  };

  return (
    <label className={classnames(baseLabelClassName, className)}>
      <span
        role="button"
        className={spanClassName}
        onClick={onClickHandler}
        onKeyDown={onClickHandler}
        tabIndex="0"
      >
        {label}
        {isSortable && (
          <Icon
            name={sortIconMap[sortDirection]}
            className={classnames(
              'mx-2 w-2',
              sortDirection !== 'none' ? 'text-primary-light' : 'text-primary-main'
            )}
          />
        )}
      </span>
      <span>{children}</span>
    </label>
  );
};

InputLabelWrapper.propTypes = {
  label: PropTypes.string.isRequired,
  isSortable: PropTypes.bool.isRequired,
  sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none']).isRequired,
  onLabelClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default InputLabelWrapper;
