import React from 'react';
import PropTypes from 'prop-types';
import DatasetSelector from './DatasetSelector';
import './googleCloud.css';
import { withTranslation } from 'react-i18next';
import { withModal } from '@ohif/ui';
import * as GoogleCloudUtilServers from './utils/getServers';

import { servicesManager } from './../App.js';

function DicomStorePickerModal({
  isOpen = false,
  setServers,
  onClose,
  t,
  user,
  url,
  show,
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
      });
    }
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
  show: PropTypes.func,
};

export default withTranslation('Common')(DicomStorePickerModal);
