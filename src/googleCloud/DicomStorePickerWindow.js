import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DatasetSelector from './DatasetSelector';
import './googleCloud.css';

class DicomStorePickerWindow extends Component {
  static propTypes = {
    url: PropTypes.string,
    oidcStorageKey: PropTypes.string.isRequired,
    setServers: PropTypes.func.isRequired,
    onClose: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.element = React.createRef();
    this.handleEvent = this.handleEvent.bind(this);
  }

  componentDidMount() {}

  handleEvent(data) {
    const servers = [
      {
        name: data.dicomStore,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        qidoSupportsIncludeField: false,
        requestOptions: { requestFromBrowser: true },
        type: 'dicomWeb',
        qidoRoot: data.qidoRoot,
        wadoRoot: data.wadoRoot,
        wadoUriRoot: data.wadoUriRoot,
        active: true,
      },
    ];

    this.props.setServers(servers);
  }

  render() {
    return (
      <div className="gcp-window">
        <DatasetSelector
          setServers={this.handleEvent}
          oidcKey={this.props.oidcStorageKey}
          url={this.props.url}
        ></DatasetSelector>
        <button className="btn btn-primary" onClick={this.props.onClose}>
          close
        </button>
      </div>
    );
  }
}

export default DicomStorePickerWindow;
