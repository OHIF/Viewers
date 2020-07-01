import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Icon, IconButton } from '@ohif/ui';

function ActionButtons({ onExportClick, onCreateReportClick }) {
  return (
    <React.Fragment>
      <ButtonGroup className="group outline-none" onClick={onExportClick}>
        <Button
          className="px-2 py-2 text-base text-white bg-black border-primary-main group-hover:border-black group-hover:bg-primary-main group-focus:bg-primary-main group-focus:border-black"
          size="initial"
          color="inherit"
        >
          Export
        </Button>
        <IconButton
          className="px-2 text-white bg-black border-primary-main group-hover:bg-primary-main group-hover:border-black group-focus:bg-primary-main group-focus:border-black"
          color="inherit"
          size="initial"
        >
          <Icon name="arrow-down" />
        </IconButton>
      </ButtonGroup>
      <Button
        className="px-2 py-2 ml-2 text-base text-white bg-black border border-primary-main hover:bg-primary-main hover:border-black focus:bg-primary-main focus:border-black"
        variant="outlined"
        size="initial"
        color="inherit"
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
