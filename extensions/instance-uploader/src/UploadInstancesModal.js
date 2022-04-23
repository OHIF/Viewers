import OHIF from '@ohif/core';
import React, { useState, useEffect } from 'react';
import { uploadInstances } from './uploadInstances';
import PropTypes from 'prop-types';

const UploadInstancesModal = ({
  dicomWebClient,
  StudyInstanceUID,
  onClose,
}) => {
  const [status, setStatus] = useState({ notificationType: '', text: '' });
  const [size, setSize] = useState('');

  useEffect(() => {
    setStatus({
      notificationType: '',
      text: '',
    });
    uploadInstances(
      dicomWebClient,
      StudyInstanceUID,
      (notificationType, text) => {
        setStatus({ notificationType: notificationType, text: text });
        if (notificationType === 'uploading') setSize(text);
      }
    )
      .then(() => {
        OHIF.log.info('Files successfully uploaded:');
        setStatus({
          notificationType: 'successfully uploaded',
          text: '',
        });
      })
      .catch(error => {
        OHIF.log.error('Error uploading instances...', error.message);
        setStatus({
          notificationType: 'Error',
          text: error.message + ' : ' + error.response,
        });
      });
  }, [StudyInstanceUID, dicomWebClient]);

  let info;
  switch (status.notificationType) {
    case 'uploading':
      info = 'Transferred: ' + status.text;
      break;
    case 'successfully uploaded':
      info = (
        <span>
          <p>{'Total Size: ' + size}</p>
          <p>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Ok
            </button>
          </p>
        </span>
      );
      break;
    case 'Error':
      info = (
        <span>
          {status.text}
          <br></br>

          <button type="button" className="btn btn-danger" onClick={onClose}>
            Ok
          </button>
        </span>
      );
      break;
    default:
      info = status.text;
  }
  return (
    <div className="download-study-modal-container">
      Status: {status.notificationType} <br></br>
      {info}
    </div>
  );
};

UploadInstancesModal.propTypes = {
  dicomWebClient: PropTypes.object.isRequired,
  StudyInstanceUID: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default UploadInstancesModal;
