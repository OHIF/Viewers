import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon } from '@ohif/ui';

const baseLabelClassName =
  'flex flex-col flex-1 text-white text-lg pl-1 select-none';
const spanClassName = 'flex flex-row items-center cursor-pointer';
const sortIconMap = {
  ascending: 'sorting-active-up',
  descending: 'sorting-active-down',
  none: 'sorting',
};

const InputLabelWrapper = ({
  label,
  isSortable,
  sortDirection,
  onLabelClick,
  className,
  children,
}) => {
  return (
    <label className={classnames(baseLabelClassName, className)}>
      <span
        className={spanClassName}
        onClick={onLabelClick}
        onKeyDown={onLabelClick}
      >
        {label}
        {isSortable && (
          <Icon
            name={sortIconMap[sortDirection]}
            className={classnames(
              'mx-2 w-2',
              sortDirection !== 'none'
                ? 'text-custom-aquaBright'
                : 'text-custom-blue'
            )}
          />
        )}
      </span>
      <span>{children}</span>
    </label>
  );
};

InputLabelWrapper.defaultProps = {
  className: '',
};

InputLabelWrapper.propTypes = {
  label: PropTypes.string.isRequired,
  isSortable: PropTypes.bool.isRequired,
  sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none'])
    .isRequired,
  onLabelClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default InputLabelWrapper;
