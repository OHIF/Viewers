import React, { useEffect, useCallback } from 'react';
import { View2D } from 'react-vtkjs-viewport';
import PropTypes from 'prop-types';

import './VTKViewport.css';

const VTKViewport = props => {
  const style = { width: '100%', height: '100%', position: 'relative' };

  const setViewportActiveHandler = useCallback(() => {
    const { setViewportActive, viewportIndex, activeViewportIndex } = props;

    if (viewportIndex !== activeViewportIndex) {
      // set in Connected
      setViewportActive();
    }
  });

  useEffect(() => {
    const handleScrollEvent = evt => {
      const vtkViewportApiReference = props.onScroll(props.viewportIndex) || {};
      const viewportUID = vtkViewportApiReference.uid;
      const viewportWasScrolled = viewportUID === evt.detail.uid;

      if (viewportWasScrolled) {
        setViewportActiveHandler();
      }
    };

    window.addEventListener('vtkscrollevent', handleScrollEvent);
    return () =>
      window.removeEventListener('vtkscrollevent', handleScrollEvent);
  }, [props, props.onScroll, props.viewportIndex, setViewportActiveHandler]);

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
  /* Receives viewportIndex */
  onScroll: PropTypes.func,
};

VTKViewport.defaultProps = {
  onScroll: () => {},
};

export default VTKViewport;
