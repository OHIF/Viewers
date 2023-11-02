import React from 'react';

type AllInOneMenuHeaderItemProps = {
  children: unknown;
};

const AllInOneMenuHeaderItem = ({ children }: AllInOneMenuHeaderItemProps) => {
  return (
    <div className="text-aqua-pale mx-2 flex h-6 shrink-0 items-center text-[11px]">{children}</div>
  );
};

export default AllInOneMenuHeaderItem;
