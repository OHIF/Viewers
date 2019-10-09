import { LayoutButton } from '@ohif/ui';
import OHIF from '@ohif/core';
import { connect } from 'react-redux';

const { setLayout, setViewportActive } = OHIF.redux.actions;

const mapStateToProps = state => {
  return {
    currentLayout: state.viewports.layout,
    activeViewportIndex: state.viewports.activeViewportIndex
  };
};

const mapDispatchToProps = dispatch => {
  return {
    // TODO: Change if layout switched becomes more complex
    onChange: (selectedCell, currentLayout, activeViewportIndex) => {
      let viewports = [];
      const rows = selectedCell.row + 1;
      const columns = selectedCell.col + 1;
      const numViewports = rows * columns;
      for (let i = 0; i < numViewports; i++) {
        // Hacky way to allow users to exit MPR "mode"
        const viewport = currentLayout.viewports[i];
        let plugin = viewport && viewport.plugin;
        if (viewport && viewport.vtk) {
          plugin = 'cornerstone';
        }

        viewports.push({
          height: `${100 / rows}%`,
          width: `${100 / columns}%`,
          plugin,
        });
      }
      const layout = {
        viewports,
      };

      const maxActiveIndex = rows * columns - 1;
      if (activeViewportIndex > maxActiveIndex) {
        dispatch(setViewportActive(0));
      }

      dispatch(setLayout(layout));
    },
  };
};

const mergeProps = (propsFromState, propsFromDispatch) => {
  const onChangeFromDispatch = propsFromDispatch.onChange;
  const { currentLayout, activeViewportIndex } = propsFromState;

  return {
    onChange: selectedCell => onChangeFromDispatch(selectedCell, currentLayout, activeViewportIndex)
  };
}

const ConnectedLayoutButton = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(LayoutButton);

export default ConnectedLayoutButton;
