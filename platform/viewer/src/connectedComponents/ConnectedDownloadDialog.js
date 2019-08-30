import { connect } from 'react-redux';
import { DownloadDialog } from '@ohif/ui';
import OHIF from '@ohif/core';
import DownloadViewportEngine from '../lib/DownloadViewportEngine';

const downloadEngine = new DownloadViewportEngine();

const { setViewportSpecificData, forceViewportUpdate } = OHIF.redux.actions;

const mapStateToProps = state => {
  const { viewportSpecificData, activeViewportIndex } = state.viewports;
  const { dom } = viewportSpecificData[activeViewportIndex] || {};

  return {
    activeEnabledElement: dom,
    activeViewportIndex: state.viewports.activeViewportIndex,
    takeAndDownloadSnapShot: downloadEngine.save,
    mountPreview:  downloadEngine.mountPreview,
    cleanViewPortClone: downloadEngine.clean,
    onResize: downloadEngine.setElementSize,
    toggleAnnotations: downloadEngine.toggleAnnotations,
    updateHash: state.viewports.updateHash,
    setCacheReferences: downloadEngine.updateCache,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dispatchSetViewportSpecificData: (viewportIndex, data) => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    },
    forceRenderUpdate: () => {
      dispatch(forceViewportUpdate());
    },
  };
};

const ConnectedDownloadDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(DownloadDialog);

export default ConnectedDownloadDialog;
