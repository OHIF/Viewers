import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DicomUploader from './DicomUploader';
import { withTranslation } from 'react-i18next';
import { servicesManager } from './../App.js';

function DicomFileUploaderModal({
                                 isOpen = false,
                                 onClose,
                                 url,
                                 retrieveAuthHeaderFunction,
                                 t,
                               }) {
  const { UIModalService } = servicesManager.services;

  const showDicomStorePickerModal = () => {
    if (!UIModalService) {
      return
    }

    UIModalService.show({
      content: DicomUploader,
      title: t('Upload DICOM Files'),
      contentProps: {
        url,
        retrieveAuthHeaderFunction
      },
      onClose,
    });
  };

  return (
    <React.Fragment>{isOpen && showDicomStorePickerModal()}</React.Fragment>
  );
}

DicomFileUploaderModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  retrieveAuthHeaderFunction: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  url: PropTypes.string,
};

export default withTranslation('Common')(DicomFileUploaderModal);
