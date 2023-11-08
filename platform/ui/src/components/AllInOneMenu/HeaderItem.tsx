import React from 'react';

type HeaderItemProps = {
  children: unknown;
};

const HeaderItem = ({ children }: HeaderItemProps) => {
  return (
    <div className="text-aqua-pale mx-2 flex h-6 shrink-0 items-center text-[11px]">{children}</div>
  );
};

export default HeaderItem;
