import { LayoutButton } from '@ohif/ui';
import OHIF from '@ohif/core';
import { connect } from 'react-redux';

const { setLayout } = OHIF.redux.actions;

const mapStateToProps = state => {
  return {
    currentLayout: state.viewports.layout,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    // TODO: Change if layout switched becomes more complex
    onChange: selectedCell => {
      let viewports = [];
      const rows = selectedCell.row + 1;
      const columns = selectedCell.col + 1;
      const numViewports = rows * columns;
      for (let i = 0; i < numViewports; i++) {
        viewports.push({
          height: `${100 / rows}%`,
          width: `${100 / columns}%`,
        });
      }
      const layout = {
        viewports,
      };

      dispatch(setLayout(layout));
    },
  };
};

const ConnectedLayoutButton = connect(
  mapStateToProps,
  mapDispatchToProps
)(LayoutButton);

export default ConnectedLayoutButton;
