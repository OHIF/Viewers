import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { useViewportGrid } from '@ohif/ui-next';
import ViewportWindowLevel from '../ViewportWindowLevel/ViewportWindowLevel';

const ActiveViewportWindowLevel = ({ servicesManager }: withAppTypes): ReactElement => {
  const activeViewportId = useViewportGrid(state => state.activeViewportId);

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
  servicesManager: PropTypes.object.isRequired,
};

export default ActiveViewportWindowLevel;
