import React, { Component } from 'react';
import PropTypes from 'prop-types';

const DICOM_FILE_UPLOADER_ID = 'gcp-dicom-uploader';
const EVENT_NAME = 'onClose';

class DicomFileUploader extends Component {
  static propTypes = {
    url: PropTypes.string,
    oidcStorageKey: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);

    this.element = React.createRef();
  }

  componentDidMount() {
    //this.element.current.addEventListener(EVENT_NAME, this.handleEvent);
    // TODO: Why doesn't addEventListener work?
    window.$(`#${DICOM_FILE_UPLOADER_ID}`).on(EVENT_NAME, this.handleEvent);
  }

  handleEvent = (event, data) => {
    console.warn('Selected!!!');
  };

  componentWillUnmount() {
    //this.element.current.removeEventListener(EVENT_NAME, this.handleEvent);

    window.$(`#${DICOM_FILE_UPLOADER_ID}`).off(EVENT_NAME, this.handleEvent);
  }

  render() {
    return (
      <gcp-dicom-uploader
        ref={this.element}
        id={DICOM_FILE_UPLOADER_ID}
        event={EVENT_NAME}
        oidc-key={this.props.oidcStorageKey}
        url={this.props.url}
      />
    );
  }
}

export default DicomFileUploader;
