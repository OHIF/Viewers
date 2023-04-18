import React, { Component } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

import microscopyManager from './tools/microscopyManager';
import './DicomMicroscopyViewport.css';
import ViewportOverlay from './components/ViewportOverlay';
import getDicomWebClient from './utils/dicomWebClient';
import dcmjs from 'dcmjs';
import cleanDenaturalizedDataset from './utils/cleanDenaturalizedDataset';

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
    commandsManager: PropTypes.object,
  };

  /**
   * Get the nearest ROI from the mouse click point
   *
   * @param event
   * @param autoselect
   * @returns
   */
  getNearbyROI(event: Event, autoselect = true) {
    const _drawingSource = Object.getOwnPropertySymbols(this.viewer).find(
      p => p.description == 'drawingSource'
    );
    const _pyramid = Object.getOwnPropertySymbols(this.viewer).find(
      p => p.description == 'pyramid'
    );
    const _map = Object.getOwnPropertySymbols(this.viewer).find(
      p => p.description == 'map'
    );
    const _affine = Object.getOwnPropertySymbols(this.viewer).find(
      p => p.description == 'affine'
    );
    const feature = this.viewer[_drawingSource].getClosestFeatureToCoordinate(
      this.viewer[_map].getEventCoordinate(event)
    );

    if (feature) {
      const roiAnnotation = this.viewer._getROIFromFeature(
        feature,
        this.viewer[_pyramid].metadata,
        this.viewer[_affine]
      );
      if (roiAnnotation && autoselect) {
        microscopyManager.selectAnnotation(roiAnnotation);
      }
      return roiAnnotation;
    }
    return null;
  }

  // install the microscopy renderer into the web page.
  // you should only do this once.
  installOpenLayersRenderer(container, displaySet) {
    const loadViewer = async metadata => {
      const {
        viewer: DicomMicroscopyViewer,
        metadata: metadataUtils,
      } = await import(
        /* webpackChunkName: "dicom-microscopy-viewer" */ 'dicom-microscopy-viewer'
      );
      const microscopyViewer = DicomMicroscopyViewer.VolumeImageViewer;

      const client = getDicomWebClient({
        extensionManager: this.props.extensionManager,
        servicesManager: this.props.servicesManager,
      });

      // Parse, format, and filter metadata
      const volumeImages: any[] = [];

      /**
       * This block of code is the original way of loading DICOM into dicom-microscopy-viewer
       * as in their documentation.
       * But we have the metadata already loaded by our loaders.
       * As the metadata for microscopy DIOM files tends to be big and we don't
       * want to double load it, below we have the mechanism to reconstruct the
       * DICOM JSON structure (denaturalized) from naturalized metadata.
       * (NOTE: Our loaders cache only naturalized metadata, not the denaturalized.)
       */
      // {
      //   const retrieveOptions = {
      //     studyInstanceUID: metadata[0].StudyInstanceUID,
      //     seriesInstanceUID: metadata[0].SeriesInstanceUID,
      //   };
      //   metadata = await client.retrieveSeriesMetadata(retrieveOptions);
      //   // Parse, format, and filter metadata
      //   metadata.forEach(m => {
      //     if (
      //       volumeImages.length > 0 &&
      //       m['00200052'].Value[0] != volumeImages[0].FrameOfReferenceUID
      //     ) {
      //       console.warn(
      //         'Expected FrameOfReferenceUID of difference instances within a series to be the same, found multiple different values',
      //         m['00200052'].Value[0]
      //       );
      //       m['00200052'].Value[0] = volumeImages[0].FrameOfReferenceUID;
      //     }
      //     const image = new metadataUtils.VLWholeSlideMicroscopyImage({
      //       metadata: m,
      //     });
      //     const imageFlavor = image.ImageType[2];
      //     if (imageFlavor === 'VOLUME' || imageFlavor === 'THUMBNAIL') {
      //       volumeImages.push(image);
      //     }
      //   });
      // }

      metadata.forEach(m => {
        const inst = cleanDenaturalizedDataset(
          dcmjs.data.DicomMetaDictionary.denaturalizeDataset(m)
        );
        if (!inst['00480105']) {
          // Optical Path Sequence, no OpticalPathIdentifier?
          // NOTE: this is actually a not-well formatted DICOM VL Whole Slide Microscopy Image.
          inst['00480105'] = {
            vr: 'SQ',
            Value: [
              {
                '00480106': {
                  vr: 'SH',
                  Value: ['1'],
                },
              },
            ],
          };
        }
        const image = new metadataUtils.VLWholeSlideMicroscopyImage({
          metadata: inst,
        });
        const imageFlavor = image.ImageType[2];
        if (imageFlavor === 'VOLUME' || imageFlavor === 'THUMBNAIL') {
          volumeImages.push(image);
        }
      });

      // format metadata for microscopy-viewer
      const options = {
        client,
        metadata: volumeImages,
        retrieveRendered: false,
        controls: ['overview', 'position'],
      };

      this.viewer = new microscopyViewer(options);

      if (
        this.overlayElement &&
        this.overlayElement.current &&
        this.viewer.addViewportOverlay
      ) {
        this.viewer.addViewportOverlay({
          element: this.overlayElement.current,
          coordinates: [0, 0], // TODO: dicom-microscopy-viewer documentation says this can be false to be automatically, but it is not.
          navigate: true,
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

      this.managedViewer.addContextMenuCallback((event: Event) => {
        const roiAnnotationNearBy = this.getNearbyROI(event);

        // TODO: refactor this after Bill's changes on ContextMenu feature get merged
        this.props.commandsManager.runCommand(
          'showViewerContextMenu',
          {
            menuName: 'microscopyContextMenu',
            event,
            container,
            viewer: this.viewer,
            managedViewer: this.managedViewer,
            viewportIndex: this.props.viewportIndex,
            roiAnnotationNearBy,
          },
          'MICROSCOPY'
        );
      });
    };

    console.debug('Loading viewer metadata', displaySet);
    loadViewer(displaySet.others);
  }

  componentDidMount() {
    const { displaySets, viewportIndex } = this.props;
    const displaySet = displaySets[viewportIndex];
    this.installOpenLayersRenderer(this.container.current, displaySet);
  }

  componentDidUpdate(
    prevProps: Readonly<{}>,
    prevState: Readonly<{}>,
    snapshot?: any
  ): void {
    if (
      this.managedViewer &&
      prevProps.displaySets !== this.props.displaySets
    ) {
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
    const {
      setViewportActive,
      viewportIndex,
      activeViewportIndex,
    } = this.props;

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
