import React from 'react';
import { View2D } from 'react-vtkjs-viewport';
import PropTypes from 'prop-types';

import './VTKViewport.css';

const VTKViewport = props => {
  const style = { width: '100%', height: '100%', position: 'relative' };

  const setViewportActiveHandler = () => {
    const { setViewportActive, viewportIndex, activeViewportIndex } = props;

    if (viewportIndex !== activeViewportIndex) {
      setViewportActive();
    }
  };

  return (
    <div
      className="vtk-viewport-handler"
      style={style}
      onClick={setViewportActiveHandler}
    >
      <View2D {...props} />
    </div>
  );
};

VTKViewport.propTypes = {
  setViewportActive: PropTypes.func.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  activeViewportIndex: PropTypes.number.isRequired,
};

export default VTKViewport;
