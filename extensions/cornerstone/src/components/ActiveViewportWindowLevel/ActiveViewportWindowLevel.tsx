import React, { ReactElement } from 'react';
import { useViewportGrid } from '@ohif/ui-next';
import ViewportWindowLevel from '../ViewportWindowLevel/ViewportWindowLevel';

const ActiveViewportWindowLevel = ({ servicesManager }: withAppTypes): ReactElement<any> => {
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
