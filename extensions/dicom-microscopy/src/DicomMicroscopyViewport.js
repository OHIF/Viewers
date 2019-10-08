import React, { Component } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import PropTypes from 'prop-types';
import { api } from 'dicom-microscopy-viewer';
import debounce from 'lodash.debounce';

const microscopyViewer = api.VLWholeSlideMicroscopyImageViewer;

class DicomMicroscopyViewport extends Component {
  state = {
    error: null,
  };

  viewer = null;

  static propTypes = {
    dicomWebClient: PropTypes.object.isRequired,
    studyInstanceUid: PropTypes.string.isRequired,
    seriesInstanceUid: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);

    this.container = React.createRef();

    this.debouncedResize = debounce(() => {
      if (this.viewer) this.viewer.resize();
    }, 100);
  }

  /**
   * install the microscopy renderer into the web page.
   * you should only do this once.
   *
   * @param {*} container
   * @param {*} displaySet
   * @memberof DicomMicroscopyViewport
   */
  installOpenLayersRenderer(
    container,
    { dicomWebClient, studyInstanceUID, seriesInstanceUID }
  ) {
    const searchInstanceOptions = {
      studyInstanceUID,
      seriesInstanceUID,
    };

    dicomWebClient
      .searchForInstances(searchInstanceOptions)
      .then(instances => {
        const promises = [];
        for (let i = 0; i < instances.length; i++) {
          const sopInstanceUID = instances[i]['00080018']['Value'][0];
          const retrieveInstanceOptions = {
            studyInstanceUID,
            seriesInstanceUID,
            sopInstanceUID,
          };

          const promise = dicomWebClient
            .retrieveInstanceMetadata(retrieveInstanceOptions)
            .then(metadata => {
              const imageType = metadata[0]['00080008']['Value'];
              if (imageType[2] === 'VOLUME') {
                return metadata[0];
              }
            });
          promises.push(promise);
        }
        return Promise.all(promises);
      })
      .then(metadata => {
        metadata = metadata.filter(m => m);

        this.viewer = new microscopyViewer({
          client: dicomWebClient,
          metadata,
          retrieveRendered: false,
        });

        this.viewer.render({ container });
      });
  }

  componentDidMount() {
    const { dicomWebClient, studyInstanceUid, seriesInstanceUid } = this.props;

    this.installOpenLayersRenderer(this.container.current, {
      dicomWebClient,
      studyInstanceUID: studyInstanceUid,
      seriesInstanceUID: seriesInstanceUid,
    });
  }

  render() {
    const style = { width: '100%', height: '100%' };
    return (
      <div className={'DicomMicroscopyViewer'} style={style}>
        {ReactResizeDetector && (
          <ReactResizeDetector
            handleWidth
            handleHeight
            onResize={this.onWindowResize}
          />
        )}
        {this.state.error ? (
          <h2>{JSON.stringify(this.state.error)}</h2>
        ) : (
          <div style={style} ref={this.container} />
        )}
      </div>
    );
  }

  onWindowResize = () => {
    this.debouncedResize();
  };
}

export default DicomMicroscopyViewport;
