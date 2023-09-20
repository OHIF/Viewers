import coordinateFormatScoord3d2Geometry from '../utils/coordinateFormatScoord3d2Geometry';
import styles from '../utils/styles';

import { PubSubService } from '@ohif/core';

// Events from the third-party viewer
const ApiEvents = {
  /** Triggered when a ROI was added. */
  ROI_ADDED: 'dicommicroscopyviewer_roi_added',
  /** Triggered when a ROI was modified. */
  ROI_MODIFIED: 'dicommicroscopyviewer_roi_modified',
  /** Triggered when a ROI was removed. */
  ROI_REMOVED: 'dicommicroscopyviewer_roi_removed',
  /** Triggered when a ROI was drawn. */
  ROI_DRAWN: `dicommicroscopyviewer_roi_drawn`,
  /** Triggered when a ROI was selected. */
  ROI_SELECTED: `dicommicroscopyviewer_roi_selected`,
  /** Triggered when a viewport move has started. */
  MOVE_STARTED: `dicommicroscopyviewer_move_started`,
  /** Triggered when a viewport move has ended. */
  MOVE_ENDED: `dicommicroscopyviewer_move_ended`,
  /** Triggered when a loading of data has started. */
  LOADING_STARTED: `dicommicroscopyviewer_loading_started`,
  /** Triggered when a loading of data has ended. */
  LOADING_ENDED: `dicommicroscopyviewer_loading_ended`,
  /** Triggered when an error occurs during loading of data. */
  LOADING_ERROR: `dicommicroscopyviewer_loading_error`,
  /* Triggered when the loading of an image tile has started. */
  FRAME_LOADING_STARTED: `dicommicroscopyviewer_frame_loading_started`,
  /* Triggered when the loading of an image tile has ended. */
  FRAME_LOADING_ENDED: `dicommicroscopyviewer_frame_loading_ended`,
  /* Triggered when the error occurs during loading of an image tile. */
  FRAME_LOADING_ERROR: `dicommicroscopyviewer_frame_loading_ended`,
};

const EVENTS = {
  ADDED: 'added',
  MODIFIED: 'modified',
  REMOVED: 'removed',
  UPDATED: 'updated',
  SELECTED: 'selected',
};

/**
 * ViewerManager encapsulates the complexity of the third-party viewer and
 * expose only the features/behaviors that are relevant to the application
 */
class ViewerManager extends PubSubService {
  constructor(viewer, viewportId, container, studyInstanceUID, seriesInstanceUID) {
    super(EVENTS);
    this.viewer = viewer;
    this.viewportId = viewportId;
    this.container = container;
    this.studyInstanceUID = studyInstanceUID;
    this.seriesInstanceUID = seriesInstanceUID;

    this.onRoiAdded = this.roiAddedHandler.bind(this);
    this.onRoiModified = this.roiModifiedHandler.bind(this);
    this.onRoiRemoved = this.roiRemovedHandler.bind(this);
    this.onRoiSelected = this.roiSelectedHandler.bind(this);
    this.contextMenuCallback = () => {};

    // init symbols
    const symbols = Object.getOwnPropertySymbols(this.viewer);
    this._drawingSource = symbols.find(p => p.description === 'drawingSource');
    this._pyramid = symbols.find(p => p.description === 'pyramid');
    this._map = symbols.find(p => p.description === 'map');
    this._affine = symbols.find(p => p.description === 'affine');

    this.registerEvents();
    this.activateDefaultInteractions();
  }

  addContextMenuCallback(callback) {
    this.contextMenuCallback = callback;
  }

  /**
   * Destroys this managed viewer instance, clearing all the event handlers
   */
  destroy() {
    this.unregisterEvents();
  }

  /**
   * This is to overrides the _broadcastEvent method of PubSubService and always
   * send the ROI graphic object and this managed viewer instance.
   * Due to the way that PubSubService is written, the same name override of the
   * function doesn't work.
   *
   * @param {String} key key Subscription key
   * @param {Object} roiGraphic ROI graphic object created by the third-party API
   */
  publish(key, roiGraphic) {
    this._broadcastEvent(key, {
      roiGraphic,
      managedViewer: this,
    });
  }

  /**
   * Registers all the relevant event handlers for the third-party API
   */
  registerEvents() {
    this.container.addEventListener(ApiEvents.ROI_ADDED, this.onRoiAdded);
    this.container.addEventListener(ApiEvents.ROI_MODIFIED, this.onRoiModified);
    this.container.addEventListener(ApiEvents.ROI_REMOVED, this.onRoiRemoved);
    this.container.addEventListener(ApiEvents.ROI_SELECTED, this.onRoiSelected);
  }

  /**
   * Clears all the relevant event handlers for the third-party API
   */
  unregisterEvents() {
    this.container.removeEventListener(ApiEvents.ROI_ADDED, this.onRoiAdded);
    this.container.removeEventListener(ApiEvents.ROI_MODIFIED, this.onRoiModified);
    this.container.removeEventListener(ApiEvents.ROI_REMOVED, this.onRoiRemoved);
    this.container.removeEventListener(ApiEvents.ROI_SELECTED, this.onRoiSelected);
  }

  /**
   * Handles the ROI_ADDED event triggered by the third-party API
   *
   * @param {Event} event Event triggered by the third-party API
   */
  roiAddedHandler(event) {
    const roiGraphic = event.detail.payload;
    this.publish(EVENTS.ADDED, roiGraphic);
    this.publish(EVENTS.UPDATED, roiGraphic);
  }

  /**
   * Handles the ROI_MODIFIED event triggered by the third-party API
   *
   * @param {Event} event Event triggered by the third-party API
   */
  roiModifiedHandler(event) {
    const roiGraphic = event.detail.payload;
    this.publish(EVENTS.MODIFIED, roiGraphic);
    this.publish(EVENTS.UPDATED, roiGraphic);
  }

  /**
   * Handles the ROI_REMOVED event triggered by the third-party API
   *
   * @param {Event} event Event triggered by the third-party API
   */
  roiRemovedHandler(event) {
    const roiGraphic = event.detail.payload;
    this.publish(EVENTS.REMOVED, roiGraphic);
    this.publish(EVENTS.UPDATED, roiGraphic);
  }

  /**
   * Handles the ROI_SELECTED event triggered by the third-party API
   *
   * @param {Event} event Event triggered by the third-party API
   */
  roiSelectedHandler(event) {
    const roiGraphic = event.detail.payload;
    this.publish(EVENTS.SELECTED, roiGraphic);
  }

  /**
   * Run the given callback operation without triggering any events for this
   * instance, so subscribers will not be affected
   *
   * @param {Function} callback Callback that will run sinlently
   */
  runSilently(callback) {
    this.unregisterEvents();
    callback();
    this.registerEvents();
  }

  /**
   * Removes all the ROI graphics from the third-party API
   */
  clearRoiGraphics() {
    this.runSilently(() => this.viewer.removeAllROIs());
  }

  showROIs() {
    this.viewer.showROIs();
  }

  hideROIs() {
    this.viewer.hideROIs();
  }

  /**
   * Adds the given ROI graphic into the third-party API
   *
   * @param {Object} roiGraphic ROI graphic object to be added
   */
  addRoiGraphic(roiGraphic) {
    this.runSilently(() => this.viewer.addROI(roiGraphic, styles.default));
  }

  /**
   * Adds the given ROI graphic into the third-party API, and also add a label.
   * Used for importing from SR.
   *
   * @param {Object} roiGraphic ROI graphic object to be added.
   * @param {String} label The label of the annotation.
   */
  addRoiGraphicWithLabel(roiGraphic, label) {
    // NOTE: Dicom Microscopy Viewer will override styles for "Text" evaluations
    // to hide all other geometries, we are not going to use its label.
    // if (label) {
    //   if (!roiGraphic.properties) roiGraphic.properties = {};
    //   roiGraphic.properties.label = label;
    // }
    this.runSilently(() => this.viewer.addROI(roiGraphic, styles.default));

    this._broadcastEvent(EVENTS.ADDED, {
      roiGraphic,
      managedViewer: this,
      label,
    });
  }

  /**
   * Sets ROI style
   *
   * @param {String} uid ROI graphic UID to be styled
   * @param {object} styleOptions - Style options
   * @param {object} styleOptions.stroke - Style options for the outline of the geometry
   * @param {number[]} styleOptions.stroke.color - RGBA color of the outline
   * @param {number} styleOptions.stroke.width - Width of the outline
   * @param {object} styleOptions.fill - Style options for body the geometry
   * @param {number[]} styleOptions.fill.color - RGBA color of the body
   * @param {object} styleOptions.image - Style options for image
   */
  setROIStyle(uid, styleOptions) {
    this.viewer.setROIStyle(uid, styleOptions);
  }

  /**
   * Removes the ROI graphic with the given UID from the third-party API
   *
   * @param {String} uid ROI graphic UID to be removed
   */
  removeRoiGraphic(uid) {
    this.viewer.removeROI(uid);
  }

  /**
   * Update properties of regions of interest.
   *
   * @param {object} roi - ROI to be updated
   * @param {string} roi.uid - Unique identifier of the region of interest
   * @param {object} roi.properties - ROI properties
   * @returns {void}
   */
  updateROIProperties({ uid, properties }) {
    this.viewer.updateROI({ uid, properties });
  }

  /**
   * Toggles overview map
   *
   * @returns {void}
   */
  toggleOverviewMap() {
    this.viewer.toggleOverviewMap();
  }

  /**
   * Activates the viewer default interactions
   * @returns {void}
   */
  activateDefaultInteractions() {
    /** Disable browser's native context menu inside the canvas */
    document.querySelector('.DicomMicroscopyViewer').addEventListener(
      'contextmenu',
      event => {
        event.preventDefault();
        // comment out when context menu for microscopy is enabled
        // if (typeof this.contextMenuCallback === 'function') {
        //   this.contextMenuCallback(event);
        // }
      },
      false
    );
    const defaultInteractions = [
      [
        'dragPan',
        {
          bindings: {
            mouseButtons: ['middle'],
          },
        },
      ],
      [
        'dragZoom',
        {
          bindings: {
            mouseButtons: ['right'],
          },
        },
      ],
      ['modify', {}],
    ];
    this.activateInteractions(defaultInteractions);
  }

  /**
   * Activates interactions
   * @param {Array} interactions Interactions to be activated
   * @returns {void}
   */
  activateInteractions(interactions) {
    const interactionsMap = {
      draw: activate => (activate ? 'activateDrawInteraction' : 'deactivateDrawInteraction'),
      modify: activate => (activate ? 'activateModifyInteraction' : 'deactivateModifyInteraction'),
      translate: activate =>
        activate ? 'activateTranslateInteraction' : 'deactivateTranslateInteraction',
      snap: activate => (activate ? 'activateSnapInteraction' : 'deactivateSnapInteraction'),
      dragPan: activate =>
        activate ? 'activateDragPanInteraction' : 'deactivateDragPanInteraction',
      dragZoom: activate =>
        activate ? 'activateDragZoomInteraction' : 'deactivateDragZoomInteraction',
      select: activate => (activate ? 'activateSelectInteraction' : 'deactivateSelectInteraction'),
    };

    const availableInteractionsName = Object.keys(interactionsMap);
    availableInteractionsName.forEach(availableInteractionName => {
      const interaction = interactions.find(
        interaction => interaction[0] === availableInteractionName
      );
      if (!interaction) {
        const deactivateInteractionMethod = interactionsMap[availableInteractionName](false);
        this.viewer[deactivateInteractionMethod]();
      } else {
        const [name, config] = interaction;
        const activateInteractionMethod = interactionsMap[name](true);
        this.viewer[activateInteractionMethod](config);
      }
    });
  }

  /**
   * Accesses the internals of third-party API and returns the OpenLayers Map
   *
   * @returns {Object} OpenLayers Map component instance
   */
  _getMapView() {
    const map = this._getMap();
    return map.getView();
  }

  _getMap() {
    const symbols = Object.getOwnPropertySymbols(this.viewer);
    const _map = symbols.find(s => String(s) === 'Symbol(map)');
    window['map'] = this.viewer[_map];
    return this.viewer[_map];
  }

  /**
   * Returns the current state for the OpenLayers View
   *
   * @returns {Object} Current view state
   */
  getViewState() {
    const view = this._getMapView();
    return {
      center: view.getCenter(),
      resolution: view.getResolution(),
      zoom: view.getZoom(),
    };
  }

  /**
   * Sets the current state for the OpenLayers View
   *
   * @param {Object} viewState View state to be applied
   */
  setViewState(viewState) {
    const view = this._getMapView();

    view.setZoom(viewState.zoom);
    view.setResolution(viewState.resolution);
    view.setCenter(viewState.center);
  }

  setViewStateByExtent(roiAnnotation) {
    const coordinates = roiAnnotation.getCoordinates();

    if (Array.isArray(coordinates[0]) && !coordinates[2]) {
      this._jumpToPolyline(coordinates);
    } else if (Array.isArray(coordinates[0])) {
      this._jumpToPolygonOrEllipse(coordinates);
    } else {
      this._jumpToPoint(coordinates);
    }
  }

  _jumpToPoint(coord) {
    const pyramid = this.viewer[this._pyramid].metadata;

    const mappedCoord = coordinateFormatScoord3d2Geometry(coord, pyramid);
    const view = this._getMapView();

    view.setCenter(mappedCoord);
  }

  _jumpToPolyline(coord) {
    const pyramid = this.viewer[this._pyramid].metadata;

    const mappedCoord = coordinateFormatScoord3d2Geometry(coord, pyramid);
    const view = this._getMapView();

    const x = mappedCoord[0];
    const y = mappedCoord[1];

    const xab = (x[0] + y[0]) / 2;
    const yab = (x[1] + y[1]) / 2;
    const midpoint = [xab, yab];

    view.setCenter(midpoint);
  }

  _jumpToPolygonOrEllipse(coordinates) {
    const pyramid = this.viewer[this._pyramid].metadata;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    coordinates.forEach(coord => {
      let mappedCoord = coordinateFormatScoord3d2Geometry(coord, pyramid);

      const [x, y] = mappedCoord;
      if (x < minX) {
        minX = x;
      } else if (x > maxX) {
        maxX = x;
      }

      if (y < minY) {
        minY = y;
      } else if (y > maxY) {
        maxY = y;
      }
    });

    const width = maxX - minX;
    const height = maxY - minY;

    minX -= 0.5 * width;
    maxX += 0.5 * width;
    minY -= 0.5 * height;
    maxY += 0.5 * height;

    const map = this._getMap();
    map.getView().fit([minX, minY, maxX, maxY], map.getSize());
  }
}

export { EVENTS };

export default ViewerManager;
