import OHIF from '@ohif/core';
import { connect } from 'react-redux';
import OHIFDicomPDFViewport from './OHIFDicomPDFViewport';

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

const ConnectedOHIFDicomPDFViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(OHIFDicomPDFViewport);

export default ConnectedOHIFDicomPDFViewer;
