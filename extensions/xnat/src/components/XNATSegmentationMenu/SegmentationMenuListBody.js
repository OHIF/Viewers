import React from 'react';
import SegmentationMenuListItem from './SegmentationMenuListItem.js';
import { newSegment } from './utils/segmentationMetadataIO';

import '../XNATRoiPanel.styl';
import { Icon } from '@ohif/ui';

/**
 * @class SegmentationMenuListBody - Renders a list of SegmentationMenuListItems,
 * displaying the metadata of segments.
 */
export default class SegmentationMenuListBody extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const {
      segments,
      activeSegmentIndex,
      onSegmentChange,
      onEditClick,
      labelmap3D,
      showColorSelectModal,
      onDeleteClick,
      onMaskClick,
    } = this.props;

    return (
      <React.Fragment>
        {segments.map(segment => (
          <SegmentationMenuListItem
            key={`${segment.metadata.SegmentLabel}_${segment.index}`}
            segmentIndex={segment.index}
            metadata={segment.metadata}
            onSegmentChange={onSegmentChange}
            onEditClick={onEditClick}
            checked={segment.index === activeSegmentIndex}
            labelmap3D={labelmap3D}
            showColorSelectModal={showColorSelectModal}
            onDeleteClick={onDeleteClick}
            onClick={onMaskClick}
          />
        ))}
      </React.Fragment>
    );
  }
}
