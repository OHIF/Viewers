import './ViewportGrid.css';
import cornerstoneTools from 'cornerstone-tools';
import React, { useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { utils } from '@ohif/core';
import { useSnackbarContext, useLogger } from '@ohif/ui';
//
import ViewportPane from './ViewportPane.js';
import DefaultViewport from './DefaultViewport.js';
import EmptyViewport from './EmptyViewport.js';
// import AppContext, {
//   useAppContext,
//   withAppContext,
// } from '../../context/AppContext';
import { getEnabledElement } from '../../../../../extensions/cornerstone/src/state';
import {
  compressSeg,
  getSegArray,
  getSplitSegArray,
  getUpdatedSegments,
  uncompress,
} from '../../../../../platform/viewer/src/appExtensions/LungModuleSimilarityPanel/utils';
import { _getFirstImageId } from '../../../../../extensions/xnat/src/components/XNATSegmentationPanel';
import getElementForFirstImageId from '../../../../../extensions/xnat/src/utils/getElementFromFirstImageId';
import { connect } from 'react-redux';
import crypto from 'crypto-js';
import { generateSegmentationMetadata } from '../../../../../extensions/xnat/src/peppermint-tools';
import refreshViewports from '../../../../../extensions/dicom-segmentation/src/utils/refreshViewports';
import { triggerEvent } from 'cornerstone-core';
import { useLocation } from 'react-router';
import { BrainMode, radcadapi } from '../../utils/constants';
import { JobsContext } from '../../context/JobsContext';
import { servicesManager } from '../../App';
import eventBus from '../../lib/eventBus';
import { useSyncedStorageState } from '../../utils/synced_storage';
import { setItem } from '../../lib/localStorageUtils';
const { UINotificationService } = servicesManager.services;

const { loadAndCacheDerivedDisplaySets, studyMetadataManager } = utils;

export const RenderLoadingModal = () => {
  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 7,
      }}
    >
      <div
        style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: 26,
        }}
      >
        Loading...
      </div>
    </div>
  );
};

const ViewportGrid = function(props) {
  const {
    activeViewportIndex,
    availablePlugins,
    defaultPlugin: defaultPluginName,
    layout,
    numRows,
    numColumns,
    setViewportData,
    studies,
    viewportData,
    children,
    isStudyLoaded,
    currentMode,
  } = props;

  const segmentationModule = cornerstoneTools.getModule('segmentation');
  const { setLoading } = useContext(JobsContext);

  const rowSize = 100 / numRows;
  const colSize = 100 / numColumns;

  // http://grid.malven.co/
  if (!viewportData || !viewportData.length) {
    return null;
  }
  const location = useLocation();

  const snackbar = useSnackbarContext();
  const logger = useLogger();

  const ref = useRef(null);
  const firstImageIdRef = useRef(null);
  const imageDimensionsRef = useRef(null);
  const delayRef = useRef(null);
  const elementRef = useRef(null);
  const changedSegmentsRef = useRef([]);
  const editedSegmentationRef = useRef({});
  const [isSegmentsLoadedSuccessfully, setSegmentloadingState] = useState(
    false
  );
  const [loadingState, setLoadingState] = useState(true);
  const [setUnsavedChanges] = useSyncedStorageState('hasUnsavedChanges', false);

  const [fetchedSegmentations, setFetchedSegmentations] = useState('idle');

  const removeSegments = () => {
    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    const element = getEnabledElement(view_ports.indexOf(viewports));

    const segmentationState = segmentationModule.state;
    let firstImageId = _getFirstImageId(props.viewportData[0]);
    const brushStackState = segmentationState.series[firstImageId];

    if (!brushStackState) {
      return [];
    }

    const labelmap3D =
      brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

    if (!labelmap3D) {
      return [];
    }

    const metadata = labelmap3D.metadata;

    if (!metadata) {
      return [];
    }

    for (let i = 0; i < metadata.length; i++) {
      segmentationModule.setters.deleteSegment(element, i);
    }
  };

  const removeSegments2 = () => {
    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    const element = getEnabledElement(view_ports.indexOf(viewports));

    const segmentationState = segmentationModule.state;
    let firstImageId = _getFirstImageId(props.viewportData[0]);
    const brushStackState = segmentationState.series[firstImageId];

    if (!brushStackState) {
      return [];
    }

    const labelmap3D =
      brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

    if (!labelmap3D) {
      return [];
    }

    const metadata = labelmap3D.metadata;

    // if (!metadata) {
    //   return [];
    // }
  };

  useEffect(() => {
    localStorage.setItem('fetchsegments', JSON.stringify(0));
    eventBus.on('completeLoadingState', data => {
      setLoadingState(false);
    });

    return () => {
      removeSegments();
      eventBus.remove('completeLoadingState');
    };
  }, []);

  useEffect(() => {
    console.log({
      activeViewportIndex,
      availablePlugins,
      defaultPlugin: defaultPluginName,
      layout,
      numRows,
      numColumns,
      setViewportData,
      studies,
      viewportData,
      children,
      isStudyLoaded,
      // appContext,
      props,
    });
    const series_uid = props.viewportData[0].SeriesInstanceUID;

    console.log({
      series_uid: props.viewportData[0],
    });

    console.log('series_uid----------149'),
      console.log(series_uid),
      localStorage.setItem('series_uid', JSON.stringify(series_uid));

    const targeDiv = ref.current;
    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];
    console.log({
      view_ports,
      viewports,
      segmentationModule,
      cornerstoneTools,
    });

    props.studies.map(study => {
      const studyMetadata = studyMetadataManager.get(study.StudyInstanceUID);
      if (studyMetadata._displaySets.length == 0) {
        study.displaySets.map(displaySet =>
          studyMetadata.addDisplaySet(displaySet)
        );
      }
    });

    let firstImageId = _getFirstImageId(props.viewportData[0]);

    const imagePlaneModule =
      cornerstone.metaData.get('imagePlaneModule', firstImageId) || {};
    const { rows, columns } = imagePlaneModule;

    console.log({
      rows,
      columns,
      firstImageId,
    });
    firstImageIdRef.current = firstImageId;
    imageDimensionsRef.current = {
      rows,
      columns,
    };
    if (location.pathname.includes('/edit'))
      targeDiv.addEventListener('mouseup', handleDragEnd);

    return () => {
      if (location.pathname.includes('/edit'))
        targeDiv.removeEventListener('mouseup', handleDragEnd);
    };
  }, [activeViewportIndex]);

  useEffect(() => {
    console.log({
      e: editedSegmentationRef.current,
    });
  }, [editedSegmentationRef.current]);

  useEffect(() => {
    if (isStudyLoaded) {
      // if (studies.length > 0) {
      viewportData.forEach(displaySet => {
        loadAndCacheDerivedDisplaySets(displaySet, studies, logger, snackbar);
      });
      if (
        location.pathname.includes('/edit') ||
        (location.pathname.includes('/selectmask') &&
          fetchedSegmentations === 'idle')
      ) {
        if (currentMode === BrainMode)
          setTimeout(() => {
            onImportButtonClick();
          }, 5000);
      }
      // }
    }
  }, [
    studies,
    viewportData,
    isStudyLoaded,
    snackbar,
    isSegmentsLoadedSuccessfully,
  ]);

  useEffect(() => {
    eventBus.on('brushUndoRedo', data => {
      handleDragEnd({});
    });
    // clean up eventbus
    return () => {
      eventBus.remove('brushUndoRedo');
    };
  }, []);

  const prepareSegList = (metadata, labelmap3D) => {
    const segList = [];
    const t0 = performance.now();

    changedSegmentsRef.current.forEach(item => {
      if (metadata[item]) {
        const t0 = performance.now();

        const hasData = labelmap3D.labelmaps2D.some(labelmap2D => {
          return labelmap2D.segmentsOnLabelmap.includes(item);
        });
        if (hasData) {
          segList.push({
            index: item,
            metadata: metadata[item],
          });
        }
        const t1 = performance.now();
        console.log(
          `Call to changedSegmentsRef loop took ${t1 - t0} milliseconds.`
        );
      }
    });
    const t1 = performance.now();
    console.log(`Call to prepareSegList loop took ${t1 - t0} milliseconds.`);
    return segList;
  };

  const getActiveToolData = () => {
    let element = elementRef.current;

    if (!element) {
      const view_ports = cornerstone.getEnabledElements();
      const viewports = view_ports[0];

      element = getEnabledElement(view_ports.indexOf(viewports));
      elementRef.current = element;
    }
    return element;
  };

  const handleDragEnd = event => {
    const tool_to_avoid = ['Pan', 'Zoom', 'Reset', 'More', 'Wwwc'];
    const last_active_tool = localStorage.getItem('setToolActive') || null;
    if (tool_to_avoid.includes(last_active_tool)) return;
    setItem('hasUnsavedChanges', true);
    // let element = getActiveToolData();
    // console.time('handleDragEnd');

    // const {
    //   labelmap3D,
    //   currentImageIdIndex,
    //   activeLabelmapIndex,
    //   ...labelmap2DRest
    // } = segmentationModule.getters.labelmap2D(element);

    // let segmentIndex = labelmap3D.activeSegmentIndex;
    // let metadata = labelmap3D.metadata;

    // changedSegmentsRef.current[segmentIndex] = segmentIndex;

    // console.timeEnd('handleDragEnd');

    // delayRef.current && clearTimeout(delayRef.current);
    // delayRef.current = setTimeout(
    //   () =>
    //     handleSaveSegmentations({
    //       metadata,
    //       labelmap3D,
    //     }),
    //   2000
    // );
  };
  const handleDragEndCore = event => {
    setItem('hasUnsavedChanges', false);
    const tool_to_avoid = ['Pan', 'Zoom', 'Reset', 'More', 'Wwwc'];
    const last_active_tool = localStorage.getItem('setToolActive') || null;
    if (tool_to_avoid.includes(last_active_tool)) return;
    let element = getActiveToolData();
    console.time('handleDragEnd');

    const {
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex,
      ...labelmap2DRest
    } = segmentationModule.getters.labelmap2D(element);

    let segmentIndex = labelmap3D.activeSegmentIndex;
    let metadata = labelmap3D.metadata;

    changedSegmentsRef.current[segmentIndex] = segmentIndex;

    console.timeEnd('handleDragEnd');

    delayRef.current && clearTimeout(delayRef.current);
    delayRef.current = setTimeout(
      () =>
        handleSaveSegmentations({
          metadata,
          labelmap3D,
        }),
      2000
    );
  };

  const handleSaveSegmentations = ({ metadata, labelmap3D }) => {
    console.time('handleSaveSegmentations');
    const segList = prepareSegList(metadata, labelmap3D);
    handleExportSegmentations(segList);
    console.timeEnd('handleSaveSegmentations');
  };

  const saveSegmentation = body => {
    return new Promise(async (res, rej) => {
      try {
        UINotificationService.show({
          title: 'Saving your last segment',
          type: 'info',
          autoClose: false,
        });

        // console.log('saving', props);
        // const series_uid = props.viewportData[0].SeriesInstanceUID;
        // console.log({ series_uid });

        // const email = props.user.profile.email;

        // console.log({ savingSegmentation: segmentation });

        // const body = {
        //   series_uid: series_uid,
        //   email,
        //   segmentation,
        //   shape,
        //   label,
        // };

        // console.log({
        //   payload: body,
        //   str: JSON.stringify(body),
        //   label,
        //   // savedHashes: editedSegmentationRef.current,
        // });

        // const hashed = crypto.SHA512(segmentation).toString();
        // const recordedHash = Object.keys(editedSegmentationRef.current).length
        //   ? editedSegmentationRef.current[label]
        //   : false;

        // console.log({
        //   hashed,
        //   recordedHash,
        //   label,
        //   editedSegmentationRef: Object.keys(editedSegmentationRef.current)
        //     .length,
        // });

        if (false) {
          // if (recordedHash && recordedHash === hashed) {
          console.log('value not changed');
          rej('value not changed');
        } else {
          console.log('');

          var requestOptions = {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              // Authorization: 'Bearer ' + state.oidc.user.access_token,
            },
            body: JSON.stringify(body),
          };

          let response = await fetch(
            `${radcadapi}/segmentations`,
            requestOptions
          );
          // let response = {};

          setLoading(true);
          response = await response.json();
          setLoading(false);
          console.log({ saveddata: response });
          // updateAndSaveLocalSegmentations(body);

          res({ response });
        }
      } catch (error) {
        setLoading(false);
        console.log({ error });
      }
    });
  };

  const saveExportations = async ({ element, segList, series_uid, email }) => {
    return new Promise(async (res, rej) => {
      const t0 = performance.now();

      console.log({ segList });

      // const imagePlaneModule =
      //   cornerstone.metaData.get('imagePlaneModule', props.firstImageId) ||
      //   {};
      // const { rows, columns } = imagePlaneModule
      const rows = imageDimensionsRef.current.rows;
      const columns = imageDimensionsRef.current.columns;
      console.log({ rows, columns });
      const numSlices = props.viewportData['0'].numImageFrames;
      const labelmap2D = segmentationModule.getters.labelmap2D(element);
      const shape = {
        slices: numSlices,
        rows: rows,
        cols: columns,
      };

      //improvement: we dont need to flatten the data do we?
      const segArray = getSegArray({
        segmentations: labelmap2D.labelmap3D.labelmaps2D,
        numSlices,
        rows,
        columns,
      });
      console.log({ segArray });

      const asyncSaveSegs = segList.map((item, index) => {
        return () =>
          new Promise(async (resolve, reject) => {
            const splitSegArray = getSplitSegArray({
              flatSegmentationArray: segArray,
              index,
            });
            const compressedSeg = await compressSeg(splitSegArray);
            const body = {
              series_uid: series_uid,
              email,
              segmentation: compressedSeg,
              label: item.metadata.SegmentLabel,
              shape,
            };
            const response = await saveSegmentation(body);
            resolve(response);
          });
      });

      // This is the new line of code:
      const resList = await Promise.all(asyncSaveSegs.map(fn => fn()));

      const t1 = performance.now();
      console.log(`Call to saveExportations took ${t1 - t0} milliseconds.`);

      console.log({ resList });
      res({ ['exportation complete']: resList });
    });
  };

  const handleExportSegmentations = async segList => {
    console.log({ segList });
    const { viewportData } = props;
    const t0 = performance.now();

    // this.setState({ exporting: true });
    // const seriesInfo = getSeriesInfoForImageId(viewportData);
    const element = getElementForFirstImageId(firstImageIdRef.current);
    // const view_ports = cornerstone.getEnabledElements();
    // const viewports = view_ports[0];
    // const element = getEnabledElement(view_ports.indexOf(viewports));

    console.log({
      segmentationModule,
    });

    const {
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex,
      ...rest
    } = segmentationModule.getters.labelmap2D(element);

    const labelMap2d = segmentationModule.getters.labelmap2D(element);
    const labelMap3d = segmentationModule.getters.labelmap3D(
      element,
      activeLabelmapIndex
    );

    console.log({
      rest,
      labelmap3D,
      segmentationModule,
      labelMap2d,
      labelMap3d,
    });

    const series_uid = props.viewportData[0].SeriesInstanceUID;
    const email = props.user.profile.email;

    await saveExportations({
      element,
      segList: segList,
      series_uid,
      email,
    });
    const t1 = performance.now();
    console.log(
      `Call to handleExportSegmentations took ${t1 - t0} milliseconds.`
    );
    return;
  };

  const updateAndSaveLocalSegmentations = b => {
    console.log({ b });
    const fetchedSegmentationsList = localStorage.getItem('segmentation');
    console.log({
      fetchedSegmentationsList,
    });
    const segmentationsList =
      fetchedSegmentationsList && fetchedSegmentationsList !== 'undefined'
        ? JSON.parse(fetchedSegmentationsList)
        : {};

    segmentationsList[b.label] = {
      segmentation: b.segmentation,
      label: b.label,
      shape: b.shape,
    };
    console.log({ segmentationsList });

    localStorage.setItem('segmentation', JSON.stringify(segmentationsList));
  };

  const addSegmentationToCanvas = ({ segmentation, label, element }) => {
    console.log('------------------------addSegmentationToCanvas');
    console.log({
      segmentation,
      label,
      element,
    });
    console.log('------------------------END');
    const labelmap2D = segmentationModule.getters.labelmap2D
      ? segmentationModule.getters.labelmap2D(element)
      : false;

    console.log({
      labelmap2D,
    });

    const {
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex,
      ...rest
    } = segmentationModule.getters.labelmap2D(element);

    let segmentIndex = labelmap3D.activeSegmentIndex;
    let metadata = labelmap3D.metadata[segmentIndex];

    console.log({
      metadata,
      segmentIndex,
    });

    if (!metadata) {
      console.log('layer not occupied');

      metadata = generateSegmentationMetadata(label);
      segmentIndex = labelmap3D.activeSegmentIndex;

      const updated2dMaps = getUpdatedSegments({
        segmentation,
        segmentIndex,
        currPixelData: labelmap3D.labelmaps2D,
      });
      console.log({
        updated2dMaps,
      });

      labelmap2D.labelmap3D.labelmaps2D = updated2dMaps;
      if (segmentIndex === 1) {
        const mDataInit = Array(1);
        mDataInit[1] = metadata;
        labelmap2D.labelmap3D.metadata = mDataInit;
      } else {
        labelmap2D.labelmap3D.metadata[segmentIndex] = metadata;
      }
      labelmap2D.labelmap3D.activeSegmentIndex = segmentIndex;

      console.log('updatedLabelmaps2s', {
        labelmap2D,
        segmentIndex,
      });
      segmentationModule.setters.updateSegmentsOnLabelmap2D(labelmap2D);

      console.log({
        updatedLm2d: segmentationModule.getters.labelmap2D(element),
      });
    } else {
      //theres something on this layer so we need to find the last layer and work on the one after it
      console.log('layer occupied', labelmap3D);

      metadata = generateSegmentationMetadata(label);
      segmentIndex = labelmap3D.metadata.length;

      const updated2dMaps = getUpdatedSegments({
        segmentation,
        segmentIndex,
        currPixelData: labelmap3D.labelmaps2D,
      });
      console.log({
        updated2dMaps,
      });

      labelmap2D.labelmap3D.labelmaps2D = updated2dMaps;
      labelmap2D.labelmap3D.metadata[segmentIndex] = metadata;
      labelmap2D.labelmap3D.activeSegmentIndex = segmentIndex;

      console.log({
        labelmap2D,
        segmentIndex,
      });
      segmentationModule.setters.updateSegmentsOnLabelmap2D(labelmap2D);

      console.log({
        updatedLm2d: segmentationModule.getters.labelmap2D(element),
      });
    }
  };

  const importSegmentationLayers = ({ segmentations }) => {
    try {
      setFetchedSegmentations('inprogress');

      const segmentationsList = Object.keys(segmentations);
      console.log({
        segmentationsList,
      });

      const view_ports = cornerstone.getEnabledElements();
      const viewports = view_ports[0];

      const element = getEnabledElement(view_ports.indexOf(viewports));

      const hashBucket = {};

      // console.time('segmentationsList each');
      segmentationsList.forEach(async (item, index) => {
        // console.time('segmentationsList each' + index);
        console.log({
          item,
        });
        const segDetails = segmentations[item];

        // const hashed = await sha256(item);
        const hashed = crypto.SHA512(segDetails.segmentation).toString();
        console.log({
          hashed,
          segDetails,
        });

        hashBucket[item] = hashed;

        const uncompressed = uncompress({
          segmentation: segDetails.segmentation,
          isNnunet: item.includes('nnunet'),
          shape:
            typeof segDetails.shape === 'string'
              ? JSON.parse(segDetails.shape)
              : segDetails.shape,
        });
        console.log({
          uncompressed,
        });

        if (!element) {
          return;
        }

        console.log({
          uncompressed,
          item,
        });

        addSegmentationToCanvas({
          segmentation: uncompressed,
          label: item,
          element,
        });
        // console.timeEnd('segmentationsList each' + index);
      });
      // console.timeEnd('segmentationsList each');

      console.log({
        hashBucket,
      });
      // const appContext = this.context;
      editedSegmentationRef.current = hashBucket;
      // setLoadingState(false);
      setFetchedSegmentations('complete');
      refreshViewports();
      triggerEvent(element, 'peppermintautosegmentgenerationevent', {});

      const updatedLabelmap2 = segmentationModule.getters.labelmap2D(element);
      // updatedLabelmap2.forEach(element => {
      //   element.pixelData.forEach(xdata => {
      //     if(xdata ==1) console.log("FOUND-------------------")
      //   });
      // });
    } catch (error) {
      setFetchedSegmentations('complete');
    }
  };

  const fetchSegmentationsFromLocalStorage = () => {
    try {
      const segmentationsJson = localStorage.getItem('segmentation');
      console.log({ segmentationsJson });
      const segmentations =
        segmentationsJson && segmentationsJson !== 'undefined'
          ? JSON.parse(segmentationsJson)
          : {};
      return segmentations;
    } catch (error) {
      console.log({ error });
    }
  };

  const fetchSegmentations = () => {
    return new Promise(async (res, rej) => {
      try {
        console.log('fetch segmentation', props);

        const series_uid = props.viewportData[0].SeriesInstanceUID;
        console.log('series_uid----------719');
        console.log(series_uid);
        // const email = 'nick.fragakis%40thetatech.ai';
        const email = props.user.profile.email;

        console.log({ series_uid });

        const body = {
          email: email, //'nick.fragakis@thetatech.ai',
        };

        console.log({ payload: body });

        var requestOptions = {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        };

        await fetch(
          `${radcadapi}/segmentations?series=${series_uid}&email=${email}`,
          requestOptions
        )
          .then(r => r.json().then(data => ({ status: r.status, data: data })))
          .then(async response => {
            console.log({ response });
            res(response.data);
          })
          .catch(error => {
            console.log(error);
          });
      } catch (error) {
        console.log({ error });
        rej(error);
      }
    });
  };

  const onImportButtonClick = async () => {
    if (
      location.pathname.includes('/edit') ||
      location.pathname.includes('/selectmask')
    ) {
      let isSegmentsLoadedSuccessfullyll = JSON.parse(
        localStorage.getItem('fetchsegments') || 0
      );
      isSegmentsLoadedSuccessfullyll == 1 ? true : false;
      if (isSegmentsLoadedSuccessfullyll) return;

      UINotificationService.show({
        title: 'Processing Segmentations',
        type: 'info',
        autoClose: true,
      });

      localStorage.setItem('fetchsegments', JSON.stringify(1));
      // const segmentations = localSavedSegmentaion.response.data;
      // setSegmentloadingState(true);
      const segmentations = await fetchSegmentations();
      console.log({ segmentations });
      importSegmentationLayers({
        segmentations,
      });

      // onIOComplete();
      return;
    }
  };

  const getViewportPanes = () =>
    layout.viewports.map((layout, viewportIndex) => {
      const displaySet = viewportData[viewportIndex];

      if (!displaySet) {
        return null;
      }

      const data = {
        displaySet,
        studies,
      };

      // JAMES TODO:

      // Use whichever plugin is currently in use in the panel
      // unless nothing is specified. If nothing is specified
      // and the display set has a plugin specified, use that.
      //
      // TODO: Change this logic to:
      // - Plugins define how capable they are of displaying a SopClass
      // - When updating a panel, ensure that the currently enabled plugin
      // in the viewport is capable of rendering this display set. If not
      // then use the most capable available plugin

      const pluginName =
        !layout.plugin && displaySet && displaySet.plugin
          ? displaySet.plugin
          : layout.plugin;

      const ViewportComponent = _getViewportComponent(
        data, // Why do we pass this as `ViewportData`, when that's not really what it is?
        viewportIndex,
        children,
        availablePlugins,
        pluginName,
        defaultPluginName
      );

      return (
        <ViewportPane
          onDrop={setViewportData}
          viewportIndex={viewportIndex} // Needed by `setViewportData`
          className={classNames('viewport-container', {
            active: activeViewportIndex === viewportIndex,
          })}
          key={viewportIndex}
        >
          {ViewportComponent}
        </ViewportPane>
      );
    });

  const ViewportPanes = React.useMemo(getViewportPanes, [
    layout,
    viewportData,
    studies,
    children,
    availablePlugins,
    defaultPluginName,
    setViewportData,
    activeViewportIndex,
  ]);

  return (
    <div
      ref={ref}
      data-cy="viewprt-grid"
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${numRows}, ${rowSize}%)`,
        gridTemplateColumns: `repeat(${numColumns}, ${colSize}%)`,
        height: '100%',
        position: 'relative',
        width: '100%',
      }}
    >
      {loadingState && <RenderLoadingModal />}
      {ViewportPanes}
    </div>
  );
};

ViewportGrid.propTypes = {
  viewportData: PropTypes.array.isRequired,
  supportsDrop: PropTypes.bool.isRequired,
  activeViewportIndex: PropTypes.number.isRequired,
  layout: PropTypes.object.isRequired,
  availablePlugins: PropTypes.object.isRequired,
  setViewportData: PropTypes.func.isRequired,
  studies: PropTypes.array,
  children: PropTypes.node,
  defaultPlugin: PropTypes.string,
  numRows: PropTypes.number.isRequired,
  numColumns: PropTypes.number.isRequired,
};

ViewportGrid.defaultProps = {
  viewportData: [],
  numRows: 1,
  numColumns: 1,
  layout: {
    viewports: [{}],
  },
  activeViewportIndex: 0,
  supportsDrop: true,
  availablePlugins: {
    DefaultViewport,
  },
  defaultPlugin: 'defaultViewportPlugin',
};

/**
 *
 *
 * @param {*} plugin
 * @param {*} viewportData
 * @param {*} viewportIndex
 * @param {*} children
 * @returns
 */
function _getViewportComponent(
  viewportData,
  viewportIndex,
  children,
  availablePlugins,
  pluginName,
  defaultPluginName
) {
  if (viewportData.displaySet) {
    pluginName = pluginName || defaultPluginName;
    const ViewportComponent = availablePlugins[pluginName];

    if (!ViewportComponent) {
      throw new Error(
        `No Viewport Component available for name ${pluginName}.
         Available plugins: ${JSON.stringify(availablePlugins)}`
      );
    }

    return (
      <ViewportComponent
        viewportData={viewportData}
        viewportIndex={viewportIndex}
        children={[children]}
      />
    );
  }

  return <EmptyViewport />;
}

// export default ViewportGrid;

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
    viewport: state.viewports,
    currentMode: state.mode.active,
  };
};

const ConnectedViewportGrid = connect(
  mapStateToProps,
  null
)(ViewportGrid);

export default ConnectedViewportGrid;
