import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const TableCell = ({
  children,
  className = '',
  colSpan = 1,
  // ignored because we don't want to expose this prop
  // eslint-disable-next-line react/prop-types
  cellsNum,
  isTableHead = false,
  align = 'left',
  style = {},
}) => {
  const classes = {
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
    isTableHead: {
      true: '',
      false: 'border-r border-secondary-light',
    },
  };

  return (
    <div
      className={classnames(
        'break-all px-2 last:border-r-0',
        `w-${colSpan}/${cellsNum}`,
        classes.align[align],
        classes.isTableHead[isTableHead],
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};

TableCell.propTypes = {
  align: PropTypes.oneOf(['left', 'center', 'right', 'justify']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  colSpan: PropTypes.number,
  isTableHead: PropTypes.bool,
  style: PropTypes.object,
};

export default TableCell;
