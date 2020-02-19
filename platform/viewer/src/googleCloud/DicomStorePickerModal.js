import React from 'react';
import PropTypes from 'prop-types';
import DatasetSelector from './DatasetSelector';
import './googleCloud.css';
import { withTranslation } from 'react-i18next';
import * as GoogleCloudUtilServers from './utils/getServers';

import { servicesManager } from './../App.js';

function DicomStorePickerModal({
  isOpen = false,
  setServers,
  onClose,
  t,
  user,
  url,
}) {
  const { UIDialogService } = servicesManager.services;

  const showDicomStorePickerModal = () => {
    const handleEvent = data => {
      const servers = GoogleCloudUtilServers.getServers(data, data.dicomstore);
      setServers(servers);
      // Force auto close
      UIDialogService.dismiss({ id: 'dicomStorePickerModal' });
      onClose();
    };

    UIDialogService.dismiss({ id: 'dicomStorePickerModal' });
    UIDialogService.create({
      id: 'dicomStorePickerModal',
      centralize: false,
      isDraggable: false,
      showOverlay: true,
      content: DatasetSelector,
      contentProps: {
        setServers: handleEvent,
        user,
        url,
        title: t('Google Cloud Healthcare API'),
      },
    });
  };

  return (
    <React.Fragment>{isOpen && showDicomStorePickerModal()}</React.Fragment>
  );
}

DicomStorePickerModal.propTypes = {
  url: PropTypes.string,
  user: PropTypes.object.isRequired,
  setServers: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
};

export default withTranslation('Common')(DicomStorePickerModal);
