import * as React from 'react';

export function PreviewHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div className="absolute right-2 top-4 z-10 mt-1 mr-3 flex items-center gap-1">{children}</div>
  );
}
