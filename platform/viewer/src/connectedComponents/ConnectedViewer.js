import { connect } from "react-redux";
import Viewer from "./Viewer.js";
import OHIF from "@ohif/core";

const { setTimepoints, setMeasurements } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  return {
    viewports: state.viewports.viewportSpecificData,
    activeViewportIndex: state.viewports.activeViewportIndex
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onTimepointsUpdated: timepoints => {
      dispatch(setTimepoints(timepoints));
    },
    onMeasurementsUpdated: measurements => {
      dispatch(setMeasurements(measurements));
    }
  };
};

const ConnectedViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Viewer);

export default ConnectedViewer;
