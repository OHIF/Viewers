import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import {
  calculateMaskRoi2DStats,
  getRoiMeasurementUnits,
} from '../../peppermint-tools';
import SegmentStats from './SegmentStats';

import './SegmentationStatsMenu.styl';

const SegmentationStatsMenu = props => {
  const { segments, frameIndex, activeViewportIndex, modality } = props;

  if (!segments || segments.length === 0) {
    return null;
  }

  const enabledElements = cornerstone.getEnabledElements();
  if (!enabledElements || enabledElements.length === 0) {
    return null;
  }

  calculateMaskRoi2DStats(
    enabledElements[activeViewportIndex].element,
    frameIndex
  );

  const { rowPixelSpacing } = enabledElements[activeViewportIndex].image;
  const units = getRoiMeasurementUnits(modality, rowPixelSpacing);
  const pixelUnit = units.pixelUnit ? ` (${units.pixelUnit})` : '';

  return (
    <div className="roiPanelFooter scrolledFooter">
      <div className="SegmentationStatsMenu">
        <div>
          <h5>2D Segment Stats for the Current Frame</h5>
        </div>
        <table className="collectionTable">
          <thead>
            <tr>
              <th width="40%" className="left-aligned-cell">
                Label
              </th>
              <th className="centered-cell">Area{` (${units.areaUnit})`}</th>
              <th className="centered-cell">Mean{`${pixelUnit}`}</th>
              <th className="centered-cell">StdDev{`${pixelUnit}`}</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((segment, index) => {
              return (
                <SegmentStats
                  key={index}
                  metadata={segment.metadata}
                  frameIndex={frameIndex}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

SegmentationStatsMenu.propTypes = {
  segments: PropTypes.array,
  frameIndex: PropTypes.number,
  activeViewportIndex: PropTypes.number,
  modality: PropTypes.string,
};

SegmentationStatsMenu.defaultProps = {
  segments: [],
  frameIndex: 0,
  activeViewportIndex: 0,
  modality: '',
};

export default SegmentationStatsMenu;
