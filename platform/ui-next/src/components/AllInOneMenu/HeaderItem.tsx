import React, { ReactNode } from 'react';

type HeaderItemProps = {
  children: ReactNode;
};

const HeaderItem = ({ children }: HeaderItemProps) => {
  return (
    <div className="text-aqua-pale mx-2 flex h-6 shrink-0 items-center text-[11px]">{children}</div>
  );
};

export default HeaderItem;
