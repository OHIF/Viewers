import React, { Component } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import debounce from 'lodash.debounce';

class DicomMicroscopyViewport extends Component {
  state = {
    error: null,
  };

  viewer = null;

  constructor(props) {
    super(props);

    this.container = React.createRef();

    this.debouncedResize = debounce(() => {
      if (this.viewer) this.viewer.resize();
    }, 100);
  }

  // install the microscopy renderer into the web page.
  // you should only do this once.
  installOpenLayersRenderer(container, displaySet) {
    const dicomWebClient = displaySet.dicomWebClient;

    const searchInstanceOptions = {
      studyInstanceUID: displaySet.StudyInstanceUID,
      seriesInstanceUID: displaySet.SeriesInstanceUID,
    };

    dicomWebClient
      .searchForInstances(searchInstanceOptions)
      .then(instances => {
        const promises = [];
        for (let i = 0; i < instances.length; i++) {
          const sopInstanceUID = instances[i]['00080018']['Value'][0];

          const retrieveInstanceOptions = {
            studyInstanceUID: displaySet.StudyInstanceUID,
            seriesInstanceUID: displaySet.SeriesInstanceUID,
            sopInstanceUID,
          };

          const promise = dicomWebClient
            .retrieveInstanceMetadata(retrieveInstanceOptions)
            .then(metadata => {
              const ImageType = metadata[0]['00080008']['Value'];
              if (ImageType[2] === 'VOLUME') {
                return metadata[0];
              }
            });
          promises.push(promise);
        }
        return Promise.all(promises);
      })
      .then(async metadata => {
        metadata = metadata.filter(m => m);

        const { api } = await import(
          /* webpackChunkName: "dicom-microscopy-viewer" */ 'dicom-microscopy-viewer'
        );
        const microscopyViewer = api.VLWholeSlideMicroscopyImageViewer;

        try {
          this.viewer = new microscopyViewer({
            client: dicomWebClient,
            metadata,
            retrieveRendered: false,
          });
        } catch (error) {
          console.error('[Microscopy Viewer] Failed to load:', error);
          const {
            UINotificationService,
            LoggerService,
          } = this.props.servicesManager.services;
          if (UINotificationService) {
            const message =
              'Failed to load viewport. Please check that you have hardware acceleration enabled.';
            LoggerService.error({ error, message });
            UINotificationService.show({
              autoClose: false,
              title: 'Microscopy Viewport',
              message,
              type: 'error',
            });
          }
        }

        this.viewer.render({ container });
      });
  }

  componentDidMount() {
    const { displaySet } = this.props.viewportData;

    this.installOpenLayersRenderer(this.container.current, displaySet);
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
