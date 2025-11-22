import * as React from 'react';
import { ScrollArea } from '../../ScrollArea';

export function PreviewPanelShell({
  header,
  children,
}: {
  header?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-background relative flex h-full w-full flex-col">
      {header}
      <ScrollArea className="flex-1">
        <div className="px-3 pb-3" style={{ paddingTop: 'var(--panel-right-top-pad, 59px)' }}>
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
