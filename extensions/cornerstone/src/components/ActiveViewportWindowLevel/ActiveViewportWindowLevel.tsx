import React, { useEffect, useState, ReactElement } from 'react';
import PropTypes from 'prop-types';
import { ServicesManager } from '@ohif/core';
import ViewportWindowLevel from '../ViewportWindowLevel/ViewportWindowLevel';

const ActiveViewportWindowLevel = ({
  servicesManager,
}: {
  servicesManager: ServicesManager;
}): ReactElement => {
  const { viewportGridService } = servicesManager.services;
  const [activeViewportIndex, setActiveViewportIndex] = useState(
    () => viewportGridService.getState().activeViewportIndex ?? 0
  );

  useEffect(() => {
    const { unsubscribe } = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_INDEX_CHANGED,
      ({ viewportIndex }) => setActiveViewportIndex(viewportIndex)
    );

    return () => {
      unsubscribe();
    };
  }, [viewportGridService]);

  return (
    <ViewportWindowLevel
      servicesManager={servicesManager}
      viewportIndex={activeViewportIndex}
    />
  );
};

ActiveViewportWindowLevel.propTypes = {
  servicesManager: PropTypes.instanceOf(ServicesManager),
};

export default ActiveViewportWindowLevel;
