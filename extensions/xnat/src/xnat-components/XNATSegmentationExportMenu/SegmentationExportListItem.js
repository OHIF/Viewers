import React from 'react';
import cornerstoneTools from 'cornerstone-tools';
import ColoredCircle from '../common/ColoredCircle';

const segmentationModule = cornerstoneTools.getModule('segmentation');

import '../XNATRoiPanel.styl';

export default class SegmentationExportListItem extends React.Component {
  constructor(props = {}) {
    super(props);

    this._colorLUT = segmentationModule.getters.colorLUT(0);
    this._getColor = this._getColor.bind(this);
  }

  /**
   * _getColor - Returns a CSS formatted color for the given segIndex.
   *
   * @param  {number} segIndex The segment index.
   * @returns {string}
   */
  _getColor(segIndex) {
    const colorArray = this._colorLUT[segIndex];

    return `rgba(
      ${colorArray[[0]]}, ${colorArray[[1]]}, ${colorArray[[2]]}, 1.0
    )`;
  }

  render() {
    const { segIndex, metadata } = this.props;

    const SegmentedPropertyTypeCodeSequence =
      metadata.SegmentedPropertyTypeCodeSequence;

    let type = SegmentedPropertyTypeCodeSequence.CodeMeaning;

    if (
      SegmentedPropertyTypeCodeSequence.SegmentedPropertyTypeModifierCodeSequence
    ) {
      const modifier =
        SegmentedPropertyTypeCodeSequence
          .SegmentedPropertyTypeModifierCodeSequence.CodeMeaning;

      type += ` (${modifier})`;
    }

    return (
      <tr>
        <td className="left-aligned-cell">
          <ColoredCircle color={this._getColor(segIndex)} />{' '}
          {metadata.SegmentLabel}
        </td>
        <td className="centered-cell">
          {metadata.SegmentedPropertyCategoryCodeSequence.CodeMeaning}
        </td>
        <td className="centered-cell">{type}</td>
      </tr>
    );
  }
}
