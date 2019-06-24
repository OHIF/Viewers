import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DicomUploader from './DicomUploader';

class DicomFileUploader extends Component {
  static propTypes = {
    url: PropTypes.string,
    oidcStorageKey: PropTypes.string.isRequired,
    onClose: PropTypes.func,
  };
  state = {
    uploaded: false,
  };

  constructor(props) {
    super(props);
    this.element = React.createRef();
  }

  render() {
    if (this.props.url != null) {
      return (
        <>
          <DicomUploader
            url={this.props.url}
            oidcKey={this.props.oidcStorageKey}
          ></DicomUploader>
          <button className="btn btn-primary" onClick={this.props.onClose}>
            close
          </button>
        </>
      );
    }
    return <></>;
  }
}

export default DicomFileUploader;
