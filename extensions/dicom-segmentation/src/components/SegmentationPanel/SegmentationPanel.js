import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import moment from 'moment';
import { utils, log } from '@ohif/core';
import { ScrollableArea, TableList, Icon } from '@ohif/ui';

import {
  BrushColorSelector,
  BrushRadius,
  SegmentationItem,
  SegmentItem,
  SegmentationSelect,
} from '../index';

import './SegmentationPanel.css';
import SegmentationSettings from '../SegmentationSettings/SegmentationSettings';

const { studyMetadataManager } = utils;

const refreshViewport = () => {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    cornerstone.updateImage(enabledElement.element);
  });
};

/**
 * SegmentationPanel component
 *
 * @param {Object} props
 * @param {Array} props.studies
 * @param {Array} props.viewports - viewportSpecificData
 * @param {number} props.activeIndex - activeViewportIndex
 * @returns component
 */
const SegmentationPanel = ({ studies, viewports, activeIndex, isOpen }) => {
  /*
   * TODO: wrap get/set interactions with the cornerstoneTools
   * store with context to make these kind of things less blurry.
   */
  const segmentationModule = cornerstoneTools.getModule('segmentation');
  const { configuration } = segmentationModule;
  const DEFAULT_BRUSH_RADIUS = configuration.radius || 10;

  const [brushRadius, setBrushRadius] = useState(DEFAULT_BRUSH_RADIUS);

  /* TODO: We shouldn't hardcode this color, in the future the SEG may set the colorLUT to whatever it wants. */
  const [brushColor, setBrushColor] = useState('rgba(221, 85, 85, 1)');
  const [selectedSegment, setSelectedSegment] = useState();
  const [showSegSettings, setShowSegSettings] = useState(false);
  const [selectedSegmentation, setSelectedSegmentation] = useState();

  const viewport = viewports[activeIndex];

  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    displaySetInstanceUID,
  } = viewport;

  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
  const firstImageId = studyMetadata.getFirstImageId(displaySetInstanceUID);

  /* CornerstoneTools */
  const [brushStackState, setBrushStackState] = useState(
    segmentationModule.state.series[firstImageId]
  );

  useEffect(() => {
    setShowSegSettings(showSegSettings && !isOpen);
  }, [isOpen]);

  useEffect(() => {
    setBrushStackState(segmentationModule.state.series[firstImageId]);
  }, [studies, viewports, activeIndex, firstImageId]);

  useEffect(() => {
    if (brushStackState) {
      setSelectedSegmentation(brushStackState.activeLabelmapIndex);
    }

    const labelmapModifiedHandler = event => {
      log.warn('labelmap modified', event);
      setBrushStackState(segmentationModule.state.series[firstImageId]);
    };

    /*
     * These are specific to each element;
     * Need to iterate cornerstone-tools tracked enabled elements?
     * Then only care about the one tied to active viewport?
     */
    cornerstoneTools.store.state.enabledElements.forEach(enabledElement =>
      enabledElement.addEventListener(
        'cornerstonetoolslabelmapmodified',
        labelmapModifiedHandler
      )
    );

    return () => {
      cornerstoneTools.store.state.enabledElements.forEach(enabledElement =>
        enabledElement.removeEventListener(
          'cornerstonetoolslabelmapmodified',
          labelmapModifiedHandler
        )
      );
    };
  });

  if (!brushStackState) {
    return null;
  }

  const labelmap3D =
    brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

  /*
   * 2. UseEffect to update state? or to a least trigger a re-render
   * 4. Toggle visibility of labelmap?
   * 5. Toggle visibility of seg?
   *
   * If the port is cornerstone, just need to call a re-render.
   * If the port is vtkjs, its a bit more tricky as we now need to create a new
   */

  const getLabelmapList = () => {
    /* Get list of SEG labelmaps specific to active viewport (reference series) */
    const referencedSegDisplaysets = _getReferencedSegDisplaysets(
      StudyInstanceUID,
      SeriesInstanceUID
    );

    return referencedSegDisplaysets.map((displaySet, index) => {
      const { labelmapIndex, SeriesDate, SeriesTime } = displaySet;

      /* Map to display representation */
      const dateStr = `${SeriesDate}:${SeriesTime}`.split('.')[0];
      const date = moment(dateStr, 'YYYYMMDD:HHmmss');
      const isActiveLabelmap =
        labelmapIndex === brushStackState.activeLabelmapIndex;
      const displayDate = date.format('ddd, MMM Do YYYY');
      const displayTime = date.format('h:mm:ss a');
      const displayDescription = displaySet.SeriesDescription;

      return {
        value: labelmapIndex,
        title: displayDescription,
        description: displayDate,
        onClick: async () => {
          const activatedLabelmapIndex = await _setActiveLabelmap(
            viewport,
            studies,
            displaySet,
            firstImageId,
            brushStackState.activeLabelmapIndex
          );
          setSelectedSegmentation(activatedLabelmapIndex);
        },
      };
    });
  };

  const labelmapList = getLabelmapList();

  const segmentList = [];

  if (labelmap3D) {
    /*
     * Newly created segments have no `meta`
     * So we instead build a list of all segment indexes in use
     * Then find any associated metadata
     */
    const uniqueSegmentIndexes = labelmap3D.labelmaps2D
      .reduce((acc, labelmap2D) => {
        if (labelmap2D) {
          const segmentIndexes = labelmap2D.segmentsOnLabelmap;

          for (let i = 0; i < segmentIndexes.length; i++) {
            if (!acc.includes(segmentIndexes[i]) && segmentIndexes[i] !== 0) {
              acc.push(segmentIndexes[i]);
            }
          }
        }

        return acc;
      }, [])
      .sort((a, b) => a - b);

    const colorLutTable =
      segmentationModule.state.colorLutTables[labelmap3D.colorLUTIndex];
    const hasLabelmapMeta = labelmap3D.metadata && labelmap3D.metadata.data;

    for (let i = 0; i < uniqueSegmentIndexes.length; i++) {
      const segmentIndex = uniqueSegmentIndexes[i];

      const color = colorLutTable[segmentIndex];
      let segmentLabel = '(unlabeled)';
      let segmentNumber = segmentIndex;

      /* Meta */
      if (hasLabelmapMeta) {
        const segmentMeta = labelmap3D.metadata.data[segmentIndex];

        if (segmentMeta) {
          segmentNumber = segmentMeta.SegmentNumber;
          segmentLabel = segmentMeta.SegmentLabel;
        }
      }

      const sameSegment = selectedSegment === segmentNumber;
      const setCurrentSelectedSegment = () => {
        _setActiveSegment(
          firstImageId,
          segmentNumber,
          labelmap3D.activeSegmentIndex
        );
        setSelectedSegment(sameSegment ? null : segmentNumber);
      };

      segmentList.push(
        <SegmentItem
          key={segmentNumber}
          itemClass={`segment-item ${sameSegment && 'selected'}`}
          onClick={setCurrentSelectedSegment}
          label={segmentLabel}
          index={segmentNumber}
          color={color}
        />
      );
    }

    /*
     * Let's iterate over segmentIndexes ^ above
     * If meta has a match, use it to show info
     * If now, add "no-meta" class
     * Show default name
     */
  }

  const updateBrushSize = evt => {
    const updatedRadius = Number(evt.target.value);

    if (updatedRadius !== brushRadius) {
      setBrushRadius(updatedRadius);
      segmentationModule.setters.radius(updatedRadius);
    }
  };

  const decrementSegment = event => {
    event.preventDefault();
    if (labelmap3D.activeSegmentIndex > 1) {
      labelmap3D.activeSegmentIndex--;
    }
    setSelectedSegment(labelmap3D.activeSegmentIndex);
    updateActiveSegmentColor();
  };

  const incrementSegment = event => {
    event.preventDefault();
    labelmap3D.activeSegmentIndex++;
    setSelectedSegment(labelmap3D.activeSegmentIndex);
    updateActiveSegmentColor();
  };

  const updateActiveSegmentColor = () => {
    const color = getActiveSegmentColor();
    setBrushColor(color);
  };

  const getActiveSegmentColor = () => {
    if (!brushStackState) {
      return 'rgba(255, 255, 255, 1)';
    }

    const colorLutTable =
      segmentationModule.state.colorLutTables[labelmap3D.colorLUTIndex];
    const color = colorLutTable[labelmap3D.activeSegmentIndex];

    return `rgba(${color.join(',')})`;
  };

  const updateConfiguration = newConfiguration => {
    /* Supported configuration */
    configuration.renderFill = newConfiguration.renderFill;
    configuration.renderOutline = newConfiguration.renderOutline;
    configuration.shouldRenderInactiveLabelmaps =
      newConfiguration.shouldRenderInactiveLabelmaps;
    configuration.fillAlpha = newConfiguration.fillAlpha;
    configuration.outlineAlpha = newConfiguration.outlineAlpha;
    configuration.outlineWidth = newConfiguration.outlineWidth;
    configuration.fillAlphaInactive = newConfiguration.fillAlphaInactive;
    configuration.outlineAlphaInactive = newConfiguration.outlineAlphaInactive;
    refreshViewport();
  };

  if (showSegSettings) {
    return (
      <SegmentationSettings
        configuration={configuration}
        onBack={() => setShowSegSettings(false)}
        onChange={updateConfiguration}
      />
    );
  } else {
    return (
      <div className="dcmseg-segmentation-panel">
        <Icon
          className="cog-icon"
          name="cog"
          width="25px"
          height="25px"
          onClick={() => setShowSegSettings(true)}
        />
        {false && (
          <form className="selector-form">
            <BrushColorSelector
              defaultColor={brushColor}
              index={labelmap3D.activeSegmentIndex}
              onNext={incrementSegment}
              onPrev={decrementSegment}
            />
            <BrushRadius
              value={brushRadius}
              onChange={updateBrushSize}
              min={configuration.minRadius}
              max={configuration.maxRadius}
            />
          </form>
        )}
        <h3>Segmentations</h3>
        <div className="segmentations">
          <SegmentationSelect
            value={
              labelmapList.find(i => i.value === selectedSegmentation) || null
            }
            formatOptionLabel={SegmentationItem}
            options={labelmapList}
          />
        </div>
        <ScrollableArea>
          <TableList
            customHeader={<SegmentsHeader count={segmentList.length} />}
          >
            {segmentList}
          </TableList>
        </ScrollableArea>
      </div>
    );
  }
};

SegmentationPanel.propTypes = {
  /*
   * An object, with int index keys?
   * Maps to: state.viewports.viewportSpecificData, in `viewer`
   * Passed in MODULE_TYPES.PANEL when specifying component in viewer
   */
  viewports: PropTypes.shape({
    displaySetInstanceUID: PropTypes.string,
    frameRate: PropTypes.any,
    InstanceNumber: PropTypes.number,
    isMultiFrame: PropTypes.bool,
    isReconstructable: PropTypes.bool,
    Modality: PropTypes.string,
    plugin: PropTypes.string,
    SeriesDate: PropTypes.string,
    SeriesDescription: PropTypes.string,
    SeriesInstanceUID: PropTypes.string,
    SeriesNumber: PropTypes.any,
    SeriesTime: PropTypes.string,
    sopClassUIDs: PropTypes.arrayOf(PropTypes.string),
    StudyInstanceUID: PropTypes.string,
  }),
  activeIndex: PropTypes.number.isRequired,
  studies: PropTypes.array.isRequired,
};
SegmentationPanel.defaultProps = {};

/**
 * Returns SEG Displaysets that reference the target series, sorted by dateTime
 *
 * @param {string} StudyInstanceUID
 * @param {string} SeriesInstanceUID
 * @returns Array
 */
const _getReferencedSegDisplaysets = (StudyInstanceUID, SeriesInstanceUID) => {
  /* Referenced DisplaySets */
  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
  const referencedDisplaysets = studyMetadata.getDerivedDatasets({
    referencedSeriesInstanceUID: SeriesInstanceUID,
    Modality: 'SEG',
  });

  /* Sort */
  referencedDisplaysets.sort((a, b) => {
    const aNumber = Number(`${a.SeriesDate}${a.SeriesTime}`);
    const bNumber = Number(`${b.SeriesDate}${b.SeriesTime}`);
    return aNumber - bNumber;
  });

  return referencedDisplaysets;
};

/**
 *
 *
 * @param {*} viewportSpecificData
 * @param {*} studies
 * @param {*} displaySet
 * @param {*} firstImageId
 * @param {*} activeLabelmapIndex
 * @returns
 */
const _setActiveLabelmap = async (
  viewportSpecificData,
  studies,
  displaySet,
  firstImageId,
  activeLabelmapIndex
) => {
  if (displaySet.labelmapIndex === activeLabelmapIndex) {
    log.warn(`${activeLabelmapIndex} is already the active labelmap`);
    return;
  }

  if (!displaySet.isLoaded) {
    // What props does this expect `viewportSpecificData` to have?
    // TODO: Should this return the `labelmapIndex`?
    await displaySet.load(viewportSpecificData, studies);
  }

  const { state } = cornerstoneTools.getModule('segmentation');
  const brushStackState = state.series[firstImageId];

  brushStackState.activeLabelmapIndex = displaySet.labelmapIndex;

  refreshViewport();

  return displaySet.labelmapIndex;
};

/**
 *
 * @param {*} firstImageId
 * @param {*} activeSegmentIndex
 * @returns
 */
const _setActiveSegment = (firstImageId, segmentIndex, activeSegmentIndex) => {
  if (segmentIndex === activeSegmentIndex) {
    log.info(`${activeSegmentIndex} is already the active segment`);
    return;
  }

  const { state } = cornerstoneTools.getModule('segmentation');
  const brushStackState = state.series[firstImageId];

  const labelmap3D =
    brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];
  labelmap3D.activeSegmentIndex = segmentIndex;

  refreshViewport();

  return segmentIndex;
};

const SegmentsHeader = ({ count }) => {
  return (
    <React.Fragment>
      <div className="tableListHeaderTitle">Segments</div>
      <div className="numberOfItems">{count}</div>
    </React.Fragment>
  );
};

export default SegmentationPanel;
