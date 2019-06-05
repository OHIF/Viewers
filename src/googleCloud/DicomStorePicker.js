import React, { Component } from 'react';
import PropTypes from 'prop-types';

const DATASET_PICKER_ID = 'gcp-dataset-picker';
const EVENT_NAME = 'onSelect';

class DicomStorePicker extends Component {
  static propTypes = {
    url: PropTypes.string,
    oidcStorageKey: PropTypes.string.isRequired,
    setServers: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.element = React.createRef();
  }

  componentDidMount() {
    //this.element.current.addEventListener(EVENT_NAME, this.handleEvent);

    // TODO: Why doesn't addEventListener work?
    window.$(`#${DATASET_PICKER_ID}`).on(EVENT_NAME, this.handleEvent);
  }

  handleEvent = (event, data) => {
    const servers = [
      {
        name: data.dicomStore,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        qidoSupportsIncludeField: false,
        requestOptions: { requestFromBrowser: true }, // to be deprecated...
        type: 'dicomWeb',
        qidoRoot: data.qidoRoot,
        wadoRoot: data.wadoRoot,
        wadoUriRoot: data.wadoUriRoot,
        active: true,
      },
    ];

    this.props.setServers(servers);
  };

  componentWillUnmount() {
    //this.element.current.removeEventListener(EVENT_NAME, this.handleEvent);
    window.$(`#${DATASET_PICKER_ID}`).off(EVENT_NAME, this.handleEvent);
  }

  render() {
    return (
      <gcp-dataset-selector
        ref={this.element}
        id={DATASET_PICKER_ID}
        event={EVENT_NAME}
        oidc-key={this.props.oidcStorageKey}
        url={this.props.url}
      />
    );
  }
}

export default DicomStorePicker;
