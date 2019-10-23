import { connect } from 'react-redux';
import { DownloadDialog } from '@ohif/ui';

const mapStateToProps = state => {
  const { viewportSpecificData, activeViewportIndex } = state.viewports;
  const { dom: activeEnabledElement } = viewportSpecificData[activeViewportIndex] || {};

  return {
    activeViewport: activeEnabledElement
  };
};

const ConnectedDownloadDialog = connect(
  mapStateToProps,
  null
)(DownloadDialog);

export default ConnectedDownloadDialog;
