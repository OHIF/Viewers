import React, { ReactElement } from 'react';
import { useViewportGrid } from '@ohif/ui-next';
import ViewportWindowLevel from '../ViewportWindowLevel/ViewportWindowLevel';

interface ActiveViewportWindowLevelProps {
  servicesManager: object;
}

const ActiveViewportWindowLevel = ({
  servicesManager
}: ActiveViewportWindowLevelProps): ReactElement => {
  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;

  return (
    <>
      {activeViewportId && (
        <ViewportWindowLevel
          servicesManager={servicesManager}
          viewportId={activeViewportId}
        />
      )}
    </>
  );
};

export default ActiveViewportWindowLevel;
