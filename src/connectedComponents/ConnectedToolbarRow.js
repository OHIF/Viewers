import {
  setLeftSidebarOpen,
  setRightSidebarOpen,
} from './../store/layout/actions.js';

import ToolbarRow from './ToolbarRow';
import { connect } from 'react-redux';
import { getActiveContexts } from './../store/layout/selectors.js';

const mapStateToProps = state => {
  return {
    activeContexts: getActiveContexts(state),
    leftSidebarOpen: state.ui.leftSidebarOpen,
    rightSidebarOpen: state.ui.rightSidebarOpen,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLeftSidebarOpen: state => {
      dispatch(setLeftSidebarOpen(state));
    },
    setRightSidebarOpen: state => {
      dispatch(setRightSidebarOpen(state));
    },
  };
};

const ConnectedToolbarRow = connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolbarRow);

export default ConnectedToolbarRow;
