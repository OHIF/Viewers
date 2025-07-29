import React from 'react';
import classnames from 'classnames';

interface TableHeadProps {
  children?: unknown;
  className?: string;
  style?: object;
}

const TableHead = ({
  children,
  className = '',
  style = {}
}: TableHeadProps) => {
  return (
    <div
      className={classnames(
        'bg-secondary-dark border-secondary-light flex border-b pr-2 font-bold',
        className
      )}
      style={style}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            isTableHead: true,
          })
        : children}
    </div>
  );
};

export default TableHead;
