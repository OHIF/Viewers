import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { servicesManager } from '../App.js';

function PdfGenerator(props) {
  const { handleOnSuccess } = props;

  return (
    <div>
      <div>Show loader</div>
      {activeStep > 0 && (
        <div className="footer">
          <button
            className="btn btn-danger pull-left"
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function PdfGeneratorModal({ isOpen = false, onClose, onSuccess, t }) {
  const { UIModalService, UINotificationService } = servicesManager.services;

  const ShowModal = () => {
    if (!UIModalService) {
      return;
    }

    const handleOnSuccess = () => {
      UINotificationService.show({
        title: 'Generate PDF modal',
        message: '',
        type: 'info',
      });
      UIModalService.hide();
      // Force auto close
      onSuccess(UIModalService);
    };

    UIModalService.show({
      title: t('Generate-Pdf'),
      content: PdfGenerator,
      contentProps: {
        handleOnSuccess,
      },
      onClose,
    });
  };

  return <React.Fragment>{isOpen && ShowModal()}</React.Fragment>;
}

PdfGeneratorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
};

export default withTranslation('Common')(PdfGeneratorModal);
