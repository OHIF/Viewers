import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const TableCell = ({ children, className, isTableHead, size, style }) => {
  const sizeClasses = {
    small: 'flex-0.3',
    normal: 'flex-1',
  };

  return (
    <div
      className={classnames(
        'px-2 last:border-r-0 break-all',
        sizeClasses[size],
        {
          'border-r border-custom-violetPale': !isTableHead,
        },
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};

TableCell.defaultProps = {
  className: '',
  isTableHead: false,
  size: 'normal',
  style: {},
};

TableCell.propTypes = {
  isTableHead: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'normal']),
  style: PropTypes.object,
};

export default TableCell;
