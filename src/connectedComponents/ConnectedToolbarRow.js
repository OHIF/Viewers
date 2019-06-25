import ToolbarRow from './ToolbarRow';
import { connect } from 'react-redux';
import { getActiveContexts } from './../store/layout/selectors.js';

const mapStateToProps = state => {
  return {
    activeContexts: getActiveContexts(state),
  };
};

const ConnectedToolbarRow = connect(mapStateToProps)(ToolbarRow);

export default ConnectedToolbarRow;
