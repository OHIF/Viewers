import React, { Component } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

import microscopyManager from './tools/microscopyManager';
import './DicomMicroscopyViewport.css';
import ViewportOverlay from './components/ViewportOverlay';
import getDicomWebClient from './utils/dicomWebClient';

class DicomMicroscopyViewport extends Component {
  state = {
    error: null as any,
  };

  viewer: any = null; // dicom-microscopy-viewer instance
  managedViewer: any = null; // managed wrapper of microscopy-dicom extension

  container = React.createRef();
  overlayElement = React.createRef();
  debouncedResize: () => any;

  constructor(props: any) {
    super(props);

    this.debouncedResize = debounce(() => {
      if (this.viewer) this.viewer.resize();
    }, 100);
  }

  static propTypes = {
    viewportData: PropTypes.object,
    activeViewportIndex: PropTypes.number,
    setViewportActive: PropTypes.func,

    // props from OHIF Viewport Grid
    displaySets: PropTypes.array,
    viewportIndex: PropTypes.number,
    viewportLabel: PropTypes.string,
    dataSource: PropTypes.object,
    viewportOptions: PropTypes.object,
    displaySetOptions: PropTypes.array,

    // other props from wrapping component
    servicesManager: PropTypes.object,
    extensionManager: PropTypes.object,
  };

  // install the microscopy renderer into the web page.
  // you should only do this once.
  installOpenLayersRenderer(container, displaySet) {
    const loadViewer = async (metadata) => {
      metadata = metadata.filter((m) => m);

      const { viewer: DicomMicroscopyViewer } = await import(
        /* webpackChunkName: "dicom-microscopy-viewer" */ 'dicom-microscopy-viewer'
      );
      const microscopyViewer = DicomMicroscopyViewer.VolumeImageViewer;

      const client = getDicomWebClient();

      const options = {
        client,
        metadata,
        retrieveRendered: false,
        controls: ['overview'],
      };

      this.viewer = new microscopyViewer(options);

      if (
        this.overlayElement &&
        this.overlayElement.current &&
        this.viewer.addViewportOverlay
      ) {
        this.viewer.addViewportOverlay({
          element: this.overlayElement.current,
          className: 'OpenLayersOverlay',
        });
      }

      this.viewer.render({ container });

      const { StudyInstanceUID, SeriesInstanceUID } = displaySet;

      this.managedViewer = microscopyManager.addViewer(
        this.viewer,
        this.props.viewportIndex,
        container,
        StudyInstanceUID,
        SeriesInstanceUID
      );
    };

    console.debug('Loading viewer metadata', displaySet);
    loadViewer(displaySet.others);
  }

  componentDidMount() {
    const { displaySets, viewportIndex } = this.props;
    const displaySet = displaySets[viewportIndex];
    this.installOpenLayersRenderer(this.container.current, displaySet);
  }

  componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
    if (this.managedViewer && prevProps.displaySets !== this.props.displaySets) {
      const { displaySets } = this.props;
      const displaySet = displaySets[0];

      microscopyManager.clearAnnotations();

      // loading SR
      if (displaySet.Modality === 'SR') {
        const referencedDisplaySet = displaySet.getSourceDisplaySet();
        displaySet.load(referencedDisplaySet);
      }
    }
  }

  componentWillUnmount() {
    microscopyManager.removeViewer(this.viewer);
  }

  setViewportActiveHandler = () => {
    const { setViewportActive, viewportIndex, activeViewportIndex } =
      this.props;

    if (viewportIndex !== activeViewportIndex) {
      setViewportActive(viewportIndex);
    }
  };

  render() {
    const style = { width: '100%', height: '100%' };
    const displaySet = this.props.displaySets[0];
    const firstInstance = displaySet.firstInstance || displaySet.instance;

    return (
      <div
        className={'DicomMicroscopyViewer'}
        style={style}
        onClick={this.setViewportActiveHandler}
      >
        <div style={{ ...style, display: 'none' }}>
          <div style={{ ...style }} ref={this.overlayElement}>
            <div
              style={{ position: 'relative', height: '100%', width: '100%' }}
            >
              {displaySet && firstInstance.imageId && (
                <ViewportOverlay
                  displaySet={displaySet}
                  instance={displaySet.instance}
                  metadata={displaySet.metadata}
                />
              )}
            </div>
          </div>
        </div>
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
