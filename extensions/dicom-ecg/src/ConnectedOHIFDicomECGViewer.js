import OHIF from '@ohif/core';
import { connect } from 'react-redux';
import OHIFDicomECGViewport from './OHIFDicomECGViewport';

const { setViewportActive } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const { activeViewportIndex } = state.viewports;
  return { activeViewportIndex };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { viewportIndex } = ownProps;

  return {
    setViewportActive: () => {
      dispatch(setViewportActive(viewportIndex));
    },
  };
};

const ConnectedOHIFDicomECGViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(OHIFDicomECGViewport);

export default ConnectedOHIFDicomECGViewer;
