import { connect } from 'react-redux';
import OHIF from '@ohif/core';
import ImageFusionDialog from './ImageFusionDialog';

// import { commandsManager } from '@ohif/viewer/src/App';
// import ImageFusionDialog, { DEFAULT_FUSION_DATA } from './ImageFusionDialog';

const { setViewportSpecificData } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const { viewportSpecificData, activeViewportIndex, layout } = state.viewports;

  return {
    activeViewportIndex,
    viewportSpecificData: viewportSpecificData[activeViewportIndex] || {},
    layout,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setViewportFusionData: (viewportIndex, data) => {
      dispatch(
        setViewportSpecificData(viewportIndex, { imageFusionData: { ...data } })
      );
    },
  };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  const { activeViewportIndex, viewportSpecificData, layout } = propsFromState;
  const { isVTK } = ownProps;

  return {
    activeViewportIndex,
    viewportSpecificData,
    setViewportFusionData: (viewportIndex, data) => {
      if (isVTK) {
        // Update all viewports
        for (let i = 0; i < layout.viewports.length; i++) {
          propsFromDispatch.setViewportFusionData(i, data);
        }
      } else {
        propsFromDispatch.setViewportFusionData(viewportIndex, data);
      }
    },
    ...ownProps,
  };
};

const ConnectedImageFusionDialog = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(ImageFusionDialog);

export default ConnectedImageFusionDialog;
