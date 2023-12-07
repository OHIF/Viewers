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
  user,
  url,
  t,
}) {
  const { UIModalService } = servicesManager.services;

  const showDicomStorePickerModal = () => {
    const handleEvent = data => {
      const servers = GoogleCloudUtilServers.getServers(data, data.dicomstore);
      setServers(servers);

      // Force auto close
      UIModalService.hide();
      onClose();
    };

    if (UIModalService) {
      UIModalService.show({
        content: DatasetSelector,
        title: t('Google Cloud Healthcare API'),
        contentProps: {
          setServers: handleEvent,
          user,
          url,
        },
        onClose,
      });
    }
  };

  return (
    <React.Fragment>{isOpen && showDicomStorePickerModal()}</React.Fragment>
  );
}

DicomStorePickerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setServers: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  user: PropTypes.object.isRequired,
  url: PropTypes.string,
};

export default withTranslation('Common')(DicomStorePickerModal);
