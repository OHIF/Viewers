import React, { useEffect } from 'react';
import { View2D } from 'react-vtkjs-viewport';
import PropTypes from 'prop-types';

import './VTKViewport.css';

const VTKViewport = props => {
  const style = { width: '100%', height: '100%', position: 'relative' };

  const setViewportActiveHandler = useCallback(() => {
    const { setViewportActive, viewportIndex, activeViewportIndex } = props;

    if (viewportIndex !== activeViewportIndex) {
      setViewportActive();
    }
  });

  useEffect(() => {
    // todo: new prop for callback that fetches vtk api object
    // todo: wire up clalback w/ commands manager

    // const viewportUid = commandsManager.run(
    //   'getVtkApiForViewportIndex',
    //   props.viewportIndex
    // );
    const handleScrollEvent = evt => {
      console.log(evt.detail.uid);
      const viewportUid = '';
      const viewportWasScrolled = viewportUid === evt.detail.uid;

      if (viewportWasScrolled) {
        setViewportActiveHandler();
      }
    };

    window.addEventListener('vtkscrollevent', handleScrollEvent);
    return () =>
      window.removeEventListener('vtkscrollevent', handleScrollEvent);
  }, [setViewportActiveHandler]);

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
