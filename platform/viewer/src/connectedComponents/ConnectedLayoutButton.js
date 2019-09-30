import { LayoutButton } from '@ohif/ui';
import OHIF from '@ohif/core';
import { connect } from 'react-redux';

const { setLayout } = OHIF.redux.actions;

const mapDispatchToProps = dispatch => {
  return {
    onChange: selectedCell => {
      const numRows = selectedCell.row + 1;
      const numColumns = selectedCell.col + 1;

      dispatch(
        setLayout({
          numRows,
          numColumns,
        })
      );
    },
  };
};

const ConnectedLayoutButton = connect(
  undefined,
  mapDispatchToProps
)(LayoutButton);

export default ConnectedLayoutButton;
