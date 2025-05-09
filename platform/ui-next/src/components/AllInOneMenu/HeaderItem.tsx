import React, { ReactNode } from 'react';

type HeaderItemProps = {
  children: ReactNode;
};

const HeaderItem = ({ children }: HeaderItemProps) => {
  return (
    <div className="text-muted-foreground mx-2 flex h-6 shrink-0 items-center text-sm">
      {children}
    </div>
  );
};

export default HeaderItem;
