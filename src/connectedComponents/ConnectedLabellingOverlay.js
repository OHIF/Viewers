import { connect } from 'react-redux';
import LabellingOverlay from './LabellingOverlay';

const mapStateToProps = state => {
  if (!state.ui || !state.ui.labelling) {
    return {
      visible: false,
    };
  }

  const labellingFlowData = state.ui.labelling;

  return {
    visible: false,
    ...labellingFlowData,
  };
};

const ConnectedLabellingOverlay = connect(
  mapStateToProps,
  null
)(LabellingOverlay);

export default ConnectedLabellingOverlay;
