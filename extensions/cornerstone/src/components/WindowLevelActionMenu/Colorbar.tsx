import React, { ReactElement, useCallback } from 'react';
import { Switch } from '@ohif/ui-next';
import { useViewportRendering } from '../../hooks/useViewportRendering';

export function Colorbar({ viewportId }: { viewportId?: string } = {}): ReactElement {
  const { hasColorbar, toggleColorbar } = useViewportRendering(viewportId);

  const handleToggle = useCallback(() => {
    toggleColorbar();
  }, [toggleColorbar]);

  return (
    <div className="hover:bg-accent flex h-8 w-full flex-shrink-0 cursor-pointer items-center px-2 text-base hover:rounded">
      <div className="flex w-7 flex-shrink-0 items-center justify-center"></div>
      <span
        className="flex-grow"
        onClick={handleToggle}
      >
        Display Color bar
      </span>
      <Switch
        className="ml-2 flex-shrink-0"
        checked={!!hasColorbar}
        onCheckedChange={handleToggle}
      />
    </div>
  );
}
