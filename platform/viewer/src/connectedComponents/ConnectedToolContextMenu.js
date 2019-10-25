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

  return {
    ...toolContextMenuData,
  };
};

const ConnectedToolContextMenu = connect(
  mapStateToProps,
  null
)(ToolContextMenu);

export default ConnectedToolContextMenu;
