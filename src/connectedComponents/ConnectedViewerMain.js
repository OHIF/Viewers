import { connect } from 'react-redux';
import ViewerMain from './ViewerMain';
import OHIF from 'ohif-core';

const {
  setViewportSpecificData,
  clearViewportSpecificData,
  setToolActive,
  setActiveViewportSpecificData,
} = OHIF.redux.actions;

const mapStateToProps = state => {
  const { activeViewportIndex, layout, viewportSpecificData } = state.viewports;

  return {
    activeViewportIndex,
    layout,
    viewportSpecificData,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setViewportSpecificData: (viewportIndex, data) => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    },
    clearViewportSpecificData: () => {
      dispatch(clearViewportSpecificData());
    },
    setToolActive: tool => {
      dispatch(setToolActive(tool));
    },
    setActiveViewportSpecificData: viewport => {
      dispatch(setActiveViewportSpecificData(viewport));
    },
  };
};

const ConnectedViewerMain = connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewerMain);

export default ConnectedViewerMain;
