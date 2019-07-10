import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap-modal';
import DicomUploader from './DicomUploader';
import { withTranslation } from 'react-i18next';

class DicomFileUploaderModal extends Component {
  static propTypes = {
    url: PropTypes.string,
    oidcStorageKey: PropTypes.string.isRequired,
    onClose: PropTypes.func,
  };

  state = {
    uploaded: false,
  };

  render() {
    if (!this.props.url) {
      return null;
    }

    return (
      <Modal
        show={this.props.isOpen}
        onHide={this.props.onClose}
        aria-labelledby="ModalHeader"
        className="modal fade themed in"
        backdrop={false}
        size={'md'}
        keyboard={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {this.props.t('Google Cloud Healthcare API - DICOM Upload')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DicomUploader
            url={this.props.url}
            oidcKey={this.props.oidcStorageKey}
          />
        </Modal.Body>
      </Modal>
    );
  }
}

export default withTranslation('Common')(DicomFileUploaderModal);
