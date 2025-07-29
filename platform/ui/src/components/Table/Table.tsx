import React from 'react';
import classnames from 'classnames';

interface TableProps {
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: object;
}

const Table = ({
  children,
  className = '',
  fullWidth = true,
  style = {}
}: TableProps) => {
  const classes = {
    base: 'text-lg text-white',
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  };

  return (
    <div
      className={classnames(classes.base, classes.fullWidth[fullWidth], className)}
      style={style}
    >
      {children}
    </div>
  );
};

export default Table;
