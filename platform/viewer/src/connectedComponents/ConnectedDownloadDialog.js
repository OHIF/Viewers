import { connect } from 'react-redux';
import { DownloadDialog } from '@ohif/ui';
import OHIF from '@ohif/core';
import DownloadViewportEngine from '../lib/DownloadViewportEngine';

const downloadEngine = new DownloadViewportEngine();

const { setViewportSpecificData } = OHIF.redux.actions;

const mapStateToProps = state => {
  const { viewportSpecificData, activeViewportIndex } = state.viewports;
  const { dom: activeEnabledElement } = viewportSpecificData[activeViewportIndex] || {};

  return {
    activeEnabledElement,
    activeViewportIndex: state.viewports.activeViewportIndex,
    save: downloadEngine.save,
    mountPreview:  downloadEngine.mountPreview,
    cleanViewPortClone: downloadEngine.clean,
    resize: downloadEngine.resize,
    toggleAnnotations: downloadEngine.toggleAnnotations,
    setCacheReferences: downloadEngine.updateCache,
    getInfo: downloadEngine.getInfo,
    resetSize: downloadEngine.resetSize,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dispatchSetViewportSpecificData: (viewportIndex, data) => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    },
  };
};

const ConnectedDownloadDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(DownloadDialog);

export default ConnectedDownloadDialog;
