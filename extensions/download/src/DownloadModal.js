import OHIF from '@ohif/core';
import React, { useState, useEffect } from 'react';
import _downloadAndZip from './downloadAndZip';
import PropTypes from 'prop-types';
import { saveAs } from 'file-saver';

const DownloadModal = ({ dicomWebClient, StudyInstanceUID, onClose }) => {
  const [status, setStatus] = useState({ notificationType: '', text: '' });

  useEffect(() => {
    setStatus({
      notificationType:
        'downloading ... depending on your Internet connection and file size, this might take several minutes',
      text: '',
    });
    _downloadAndZip(
      dicomWebClient,
      StudyInstanceUID,
      (notificationType, text) =>
        setStatus({ notificationType: notificationType, text: text })
    )
      .then(url => {
        OHIF.log.info('Files successfully compressed:', url);
        setStatus({
          notificationType: 'saving',
          text: `${StudyInstanceUID}.zip`,
        });
        saveAs(url, `${StudyInstanceUID}.zip`);
      })
      .then(() => {
        setStatus({
          notificationType: 'successfully saved',
          text: '',
        });
      })
      .catch(error => {
        OHIF.log.error('Error downloading study...', error);
        setStatus({
          notificationType: 'Error downloading study...' + error,
          text: '',
        });
      });
  }, [StudyInstanceUID, dicomWebClient]);

  let info;
  switch (status.notificationType) {
    case 'downloading':
      info = 'bytes transferred: ' + status.text;
      break;
    case 'zipping':
      info = 'DICOM files: ' + status.text;
      break;
    case 'successfully saved':
      info = (
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Ok
        </button>
      );
      break;
    default:
      info = '';
  }
  return (
    <div className="download-study-modal-container">
      <p>Status: {status.notificationType}</p>
      <p>{info}</p>
    </div>
  );
};

DownloadModal.propTypes = {
  dicomWebClient: PropTypes.object.isRequired,
  StudyInstanceUID: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default DownloadModal;
