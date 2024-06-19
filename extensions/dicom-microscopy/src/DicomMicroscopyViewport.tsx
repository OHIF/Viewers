import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { LoadingIndicatorProgress } from '@ohif/ui';

import './DicomMicroscopyViewport.css';
import ViewportOverlay from './components/ViewportOverlay';
import getDicomWebClient from './utils/dicomWebClient';
import dcmjs from 'dcmjs';
import cleanDenaturalizedDataset from './utils/cleanDenaturalizedDataset';
import MicroscopyService from './services/MicroscopyService';

class DicomMicroscopyViewport extends Component {
  state = {
    error: null as any,
    isLoaded: false,
  };

  microscopyService: MicroscopyService;
  viewer: any = null; // dicom-microscopy-viewer instance
  managedViewer: any = null; // managed wrapper of microscopy-dicom extension

  container = React.createRef();
  overlayElement = React.createRef();

  constructor(props: any) {
    super(props);

    const { microscopyService } = this.props.servicesManager.services;
    this.microscopyService = microscopyService;
  }

  static propTypes = {
    viewportData: PropTypes.object,
    activeViewportId: PropTypes.string,
    setViewportActive: PropTypes.func,

    // props from OHIF Viewport Grid
    displaySets: PropTypes.array,
    viewportId: PropTypes.string,
    viewportLabel: PropTypes.string,
    dataSource: PropTypes.object,
    viewportOptions: PropTypes.object,
    displaySetOptions: PropTypes.array,

    // other props from wrapping component
    servicesManager: PropTypes.object,
    extensionManager: PropTypes.object,
    commandsManager: PropTypes.object,
    resizeRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  };

  /**
   * Need to return this as a function to prevent webpack from munging it.
   */
  public static getImportPath() {
    return '/dicom-microscopy-viewer/dicomMicroscopyViewer.min.js';
  }


  /**
   * Get the nearest ROI from the mouse click point
   *
   * @param event
   * @param autoselect
   * @returns
   */
  getNearbyROI(event: Event, autoselect = true) {
    const symbols = Object.getOwnPropertySymbols(this.viewer);
    const _drawingSource = symbols.find(p => p.description === 'drawingSource');
    const _pyramid = symbols.find(p => p.description === 'pyramid');
    const _map = symbols.find(p => p.description === 'map');
    const _affine = symbols.find(p => p.description === 'affine');

    const feature = this.viewer[_drawingSource].getClosestFeatureToCoordinate(
      this.viewer[_map].getEventCoordinate(event)
    );

    if (!feature) {
      return null;
    }

    const roiAnnotation = this.viewer._getROIFromFeature(
      feature,
      this.viewer[_pyramid].metadata,
      this.viewer[_affine]
    );
    if (roiAnnotation && autoselect) {
      this.microscopyService.selectAnnotation(roiAnnotation);
    }
    return roiAnnotation;
  }

  // install the microscopy renderer into the web page.
  // you should only do this once.
  async installOpenLayersRenderer(container, displaySet) {
    const loadViewer = async metadata => {
      await import(
        /* webpackIgnore: true */ DicomMicroscopyViewport.getImportPath());
      const { viewer: DicomMicroscopyViewer, metadata: metadataUtils } = (window as any).dicomMicroscopyViewer;

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
      //     NOTE: depending on different data source, image.ImageType sometimes
      //     is a string, not a string array.
      //     m['00080008'] = transformImageTypeUnnaturalized(m['00080008']);

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
        // NOTE: depending on different data source, image.ImageType sometimes
        //    is a string, not a string array.
        m.ImageType = typeof m.ImageType === 'string' ? m.ImageType.split('\\') : m.ImageType;

        const inst = cleanDenaturalizedDataset(
          dcmjs.data.DicomMetaDictionary.denaturalizeDataset(m),
          {
            StudyInstanceUID: m.StudyInstanceUID,
            SeriesInstanceUID: m.SeriesInstanceUID,
            dataSourceConfig: this.props.dataSource.getConfig(),
          }
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

      if (this.overlayElement && this.overlayElement.current && this.viewer.addViewportOverlay) {
        this.viewer.addViewportOverlay({
          element: this.overlayElement.current,
          coordinates: [0, 0], // TODO: dicom-microscopy-viewer documentation says this can be false to be automatically, but it is not.
          navigate: true,
          className: 'OpenLayersOverlay',
        });
      }

      this.viewer.render({ container });

      const { StudyInstanceUID, SeriesInstanceUID } = displaySet;

      this.managedViewer = this.microscopyService.addViewer(
        this.viewer,
        this.props.viewportId,
        container,
        StudyInstanceUID,
        SeriesInstanceUID
      );

      this.managedViewer.addContextMenuCallback((event: Event) => {
        // TODO: refactor this after Bill's changes on ContextMenu feature get merged
        // const roiAnnotationNearBy = this.getNearbyROI(event);
      });
    };

    this.microscopyService.clearAnnotations();

    let smDisplaySet = displaySet;
    if (displaySet.Modality === 'SR') {
      // for SR displaySet, let's load the actual image displaySet
      smDisplaySet = displaySet.getSourceDisplaySet();
    }
    console.log('Loading viewer metadata', smDisplaySet);

    await loadViewer(smDisplaySet.others);

    if (displaySet.Modality === 'SR') {
      displaySet.load(smDisplaySet);
    }
  }

  componentDidMount() {
    const { displaySets, viewportOptions } = this.props;
    // Todo-rename: this is always getting the 0
    const displaySet = displaySets[0];
    this.installOpenLayersRenderer(this.container.current, displaySet).then(() => {
      this.setState({ isLoaded: true });
    });
  }

  componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
    if (this.managedViewer && prevProps.displaySets !== this.props.displaySets) {
      const { displaySets } = this.props;
      const displaySet = displaySets[0];

      this.microscopyService.clearAnnotations();

      // loading SR
      if (displaySet.Modality === 'SR') {
        const referencedDisplaySet = displaySet.getSourceDisplaySet();
        displaySet.load(referencedDisplaySet);
      }
    }
  }

  componentWillUnmount() {
    this.microscopyService.removeViewer(this.viewer);
  }

  setViewportActiveHandler = () => {
    const { setViewportActive, viewportId, activeViewportId } = this.props;

    if (viewportId !== activeViewportId) {
      setViewportActive(viewportId);
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
            <div style={{ position: 'relative', height: '100%', width: '100%' }}>
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
        {this.state.error ? (
          <h2>{JSON.stringify(this.state.error)}</h2>
        ) : (
          <div
            style={style}
            ref={(ref: any) => {
              this.container.current = ref;
              this.props.resizeRef.current = ref;
            }}
          />
        )}
        {this.state.isLoaded ? null : (
          <LoadingIndicatorProgress className={'h-full w-full bg-black'} />
        )}
      </div>
    );
  }
}

export default DicomMicroscopyViewport;
