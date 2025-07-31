import React from 'react';
import classnames from 'classnames';

interface TableBodyProps {
  children?: unknown;
  className?: string;
  style?: object;
}

const TableBody = ({
  children,
  className = '',
  style = {}
}: TableBodyProps) => {
  return (
    <div
      className={classnames('ohif-scrollbar mt-2 max-h-48 overflow-y-scroll', className)}
      style={style}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            isTableHead: false,
          })
        : children}
    </div>
  );
};

export default TableBody;
