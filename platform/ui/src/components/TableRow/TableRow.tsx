import React from 'react';
import classnames from 'classnames';

interface TableRowProps {
  isTableHead?: boolean;
  children?: unknown;
  className?: string;
  style?: object;
}

const TableRow = ({
  children,
  className = '',
  isTableHead = false,
  style = {}
}: TableRowProps) => {
  const childrens = React.Children.map(children, child => {
    const isValidReactElement = React.isValidElement(child);

    return isValidReactElement
      ? React.cloneElement(child, { isTableHead, cellsNum: children.length })
      : children;
  });

  return (
    <div
      className={classnames('flex w-full', className)}
      style={style}
    >
      {childrens}
    </div>
  );
};

export default TableRow;
