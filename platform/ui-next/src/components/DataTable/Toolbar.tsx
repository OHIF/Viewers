import * as React from 'react';

export function Toolbar({ children }: { children?: React.ReactNode }) {
  return <div className="relative flex items-center justify-center py-4">{children}</div>;
}
