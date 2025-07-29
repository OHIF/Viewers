import React from 'react';
import classnames from 'classnames';

interface TableCellProps {
  align?: "left" | "center" | "right" | "justify";
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  isTableHead?: boolean;
  style?: object;
}

const TableCell = ({
  children,
  className = '',
  colSpan = 1,

  // ignored because we don't want to expose this prop
  // eslint-disable-next-line react/prop-types
  cellsNum,

  isTableHead = false,
  align = 'left',
  style = {}
}: TableCellProps) => {
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

export default TableCell;
