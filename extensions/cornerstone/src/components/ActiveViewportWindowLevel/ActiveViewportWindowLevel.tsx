import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { ServicesManager } from '@ohif/core';
import { useViewportGrid } from '@ohif/ui';
import ViewportWindowLevel from '../ViewportWindowLevel/ViewportWindowLevel';

const ActiveViewportWindowLevel = ({
  servicesManager,
}: {
  servicesManager: ServicesManager;
}): ReactElement => {
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

ActiveViewportWindowLevel.propTypes = {
  servicesManager: PropTypes.instanceOf(ServicesManager),
};

export default ActiveViewportWindowLevel;
