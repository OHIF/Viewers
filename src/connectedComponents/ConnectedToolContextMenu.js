import { connect } from 'react-redux';
import ToolContextMenu from './ToolContextMenu';

const mapStateToProps = (state, ownProps) => {
  if (!state.ui || !state.ui.contextMenu) {
    return {
      visible: false,
    };
  }

  const { viewportIndex } = ownProps;
  const toolContextMenuData = state.ui.contextMenu[viewportIndex];
  let availableTools;

  if (
    state.extensions &&
    state.extensions.cornerstone &&
    state.extensions.cornerstone.availableTools
  ) {
    availableTools = state.extensions.cornerstone.availableTools;
  }

  return {
    ...toolContextMenuData,
    availableTools,
  };
};

const ConnectedToolContextMenu = connect(
  mapStateToProps,
  null
)(ToolContextMenu);

export default ConnectedToolContextMenu;
