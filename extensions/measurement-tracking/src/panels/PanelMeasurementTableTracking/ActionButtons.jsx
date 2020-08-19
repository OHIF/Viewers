import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Icon, IconButton } from '@ohif/ui';

function ActionButtons({ onExportClick, onCreateReportClick }) {
  return (
    <React.Fragment>
      <ButtonGroup color="black" size="inherit">
        <Button className="text-base px-2 py-2" onClick={onExportClick}>
          Export
        </Button>
      </ButtonGroup>
      <Button
        className="ml-2 text-base"
        variant="outlined"
        size="small"
        color="black"
        onClick={onCreateReportClick}
      >
        Create Report
      </Button>
    </React.Fragment>
  );
}

ActionButtons.propTypes = {
  onExportClick: PropTypes.func,
  onCreateReportClick: PropTypes.func,
};

ActionButtons.defaultProps = {
  onExportClick: () => alert('Export'),
  onCreateReportClick: () => alert('Create Report'),
};

export default ActionButtons;
