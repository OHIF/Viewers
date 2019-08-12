import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap-modal';
import DatasetSelector from './DatasetSelector';
import './googleCloud.css';
import { withTranslation } from 'react-i18next';

class DicomStorePickerModal extends Component {
  static propTypes = {
    url: PropTypes.string,
    user: PropTypes.object.isRequired,
    setServers: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func,
  };

  static defaultProps = {
    isOpen: false,
  };

  handleEvent = data => {
    const servers = [
      {
        name: data.dicomStore,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        qidoSupportsIncludeField: false,
        type: 'dicomWeb',
        qidoRoot: data.qidoRoot,
        wadoRoot: data.wadoRoot,
        wadoUriRoot: data.wadoUriRoot,
        active: true,
        supportsFuzzyMatching: false,
      },
    ];

    this.props.setServers(servers);
  };

  render() {
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
            {this.props.t('Google Cloud Healthcare API')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DatasetSelector
            setServers={this.handleEvent}
            user={this.props.user}
            url={this.props.url}
          />
        </Modal.Body>
      </Modal>
    );
  }
}

export default withTranslation('Common')(DicomStorePickerModal);
