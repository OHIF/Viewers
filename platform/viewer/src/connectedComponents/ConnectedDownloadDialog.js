import { connect } from 'react-redux';
import { DownloadDialog } from '@ohif/ui';
import OHIF from '@ohif/core';
import DownloadViewportEngine from '../lib/DownloadViewportEngine';

const PREVIEW_ELEM_ID = 'download-viewport-clone';

const downloadEngine = new DownloadViewportEngine({
  previewElementId: PREVIEW_ELEM_ID
});

const { setViewportSpecificData } = OHIF.redux.actions;

const mapStateToProps = state => {
  const { viewportSpecificData, activeViewportIndex } = state.viewports;
  const { dom } = viewportSpecificData[activeViewportIndex] || {};

  return {
    activeEnabledElement: dom,
    activeViewportIndex: state.viewports.activeViewportIndex,
    takeAndDownloadSnapShot: downloadEngine.save,
    cloneViewport:  downloadEngine.clone,
    previewElementId: PREVIEW_ELEM_ID,
    onResize: downloadEngine.setElementSize,
    toggleAnnotations: downloadEngine.toggleAnnotations,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dispatchSetViewportSpecificData: (viewportIndex, data) => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    }
  };
};

const ConnectedDownloadDialog = connect(
  mapStateToProps,
  mapDispatchToProps
)(DownloadDialog);

export default ConnectedDownloadDialog;
