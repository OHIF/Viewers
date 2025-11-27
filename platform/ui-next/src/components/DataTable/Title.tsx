import * as React from 'react';

export function Title({ children }: { children?: React.ReactNode }) {
  return <div className="text-primary text-[20px] font-medium">{children}</div>;
}
