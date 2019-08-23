import { connect } from 'react-redux';
import { DownloadScreenShot } from '@ohif/ui';
import OHIF from '@ohif/core';
import csTools from 'cornerstone-tools';

const toolImport = csTools.import;
const scrollToIndex = toolImport('util/scrollToIndex');
const { setViewportSpecificData } = OHIF.redux.actions;

const mapStateToProps = state => {
  const { viewportSpecificData, activeViewportIndex } = state.viewports;
  const { dom } = viewportSpecificData[activeViewportIndex] || {};

  return {
    activeEnabledElement: dom,
    activeViewportIndex: state.viewports.activeViewportIndex,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dispatchSetViewportSpecificData: (viewportIndex, data) => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    },
  };
};

const ConnectedDownloadScreenShot = connect(
  mapStateToProps,
  mapDispatchToProps
)(DownloadScreenShot);

export default ConnectedDownloadScreenShot;
