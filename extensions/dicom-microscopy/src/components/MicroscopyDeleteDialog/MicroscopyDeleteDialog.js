import React from 'react';
import PropTypes from 'prop-types';
import { SimpleDialog } from '@ohif/ui';

import './MicroscopyDeleteDialog.styl';

const MicroscopyDeleteDialog = ({ title, onSubmit, onClose }) => {
  return (
    <div className="InputDialog MicroscopyDeleteDialog">
      <SimpleDialog headerTitle={title} onClose={onClose} onConfirm={onSubmit}>
        <p>Are you sure you want to remove this Region of Interest?</p>
      </SimpleDialog>
    </div>
  );
};

MicroscopyDeleteDialog.propTypes = {
  title: PropTypes.string,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
};

export default MicroscopyDeleteDialog;
