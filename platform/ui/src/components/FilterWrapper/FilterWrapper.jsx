import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon } from '@ohif/ui';

const baseLabelClassName =
  'flex flex-col flex-1 text-white text-lg pl-1 select-none';
const spanClassName = 'flex flex-row items-center cursor-pointer';
const sortIconMap = {
  '-1': 'sorting-active-down',
  0: 'sorting',
  1: 'sorting-active-up',
};

const FilterWrapper = ({
  label,
  isSortable,
  isBeingSorted,
  sortDirection,
  onLabelClick,
  className,
  children,
}) => {
  const iconProps = {
    name: isBeingSorted ? sortIconMap[sortDirection] : 'sorting',
    className: classnames(
      'mx-2 w-2',
      isBeingSorted ? 'text-custom-aquaBright' : 'text-custom-blue'
    ),
  };

  return (
    <label className={classnames(baseLabelClassName, className)}>
      <span
        className={spanClassName}
        onClick={onLabelClick}
        onKeyDown={onLabelClick}
      >
        {label}
        {isSortable && <Icon {...iconProps} />}
      </span>
      <span>{children && children}</span>
    </label>
  );
};

FilterWrapper.defaultProps = {
  label: '',
  isSortable: false,
  isBeingSorted: false,
  sortDirection: 0,
  onLabelClick: () => {},
  className: '',
};

FilterWrapper.propTypes = {
  label: PropTypes.string,
  isSortable: PropTypes.bool,
  isBeingSorted: PropTypes.bool,
  sortDirection: PropTypes.number,
  onLabelClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default FilterWrapper;
