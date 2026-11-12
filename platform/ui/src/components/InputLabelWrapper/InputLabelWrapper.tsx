import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icons } from '@ohif/ui-next';

const baseLabelClassName = 'flex flex-col flex-1 text-white text-lg pl-1 select-none';
const spanClassName = 'flex flex-row items-center cursor-pointer focus:outline-none';

const sortIconMap = {
  descending: () => <Icons.SortingDescending className="text-primary-main mx-2 w-2" />,
  ascending: () => <Icons.SortingAscending className="text-primary-main mx-2 w-2" />,
  none: () => <Icons.Sorting className="text-primary-main mx-2 w-2" />,
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
        {isSortable && sortIconMap[sortDirection]()}
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
