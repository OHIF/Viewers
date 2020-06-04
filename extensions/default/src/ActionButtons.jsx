import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Icon, IconButton } from '@ohif/ui';

function ActionButtons() {
  return (
    <React.Fragment>
      <ButtonGroup onClick={() => alert('Export')}>
        <Button
          className="px-2 py-2 text-base text-white bg-black border-primary-main"
          size="initial"
          color="inherit"
        >
          Export
        </Button>
        <IconButton
          className="px-2 text-white bg-black border-primary-main"
          color="inherit"
          size="initial"
        >
          <Icon name="arrow-down" />
        </IconButton>
      </ButtonGroup>
      <Button
        className="px-2 py-2 ml-2 text-base text-white bg-black border border-primary-main"
        variant="outlined"
        size="initial"
        color="inherit"
        onClick={() => alert('Create Report')}
      >
        Create Report
      </Button>
    </React.Fragment>
  );
}

export default ActionButtons;
