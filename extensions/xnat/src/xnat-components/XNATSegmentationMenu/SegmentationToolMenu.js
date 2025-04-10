import React from 'react';
import PropTypes from 'prop-types';
import { PEPPERMINT_TOOL_NAMES } from '../../peppermint-tools';
import SmartAndAutoBrushSettings from './SmartAndAutoBrushSettings';
import { AIAA_TOOL_NAMES } from '../../aiaa-tools';
import { ConnectedAIAAMenu } from '../AIAAMenu';
import { MONAIMenu, MONAI_TOOL_NAMES } from '../../MONAILabelClient';

const SegmentationToolMenu = ({ activeTool, toolData }) => {
  let toolMenu = null;

  if (
    activeTool === PEPPERMINT_TOOL_NAMES.BRUSH_3D_HU_GATED_TOOL ||
    activeTool === PEPPERMINT_TOOL_NAMES.BRUSH_3D_AUTO_GATED_TOOL
  ) {
    toolMenu = <SmartAndAutoBrushSettings />;
  } else if (activeTool === AIAA_TOOL_NAMES.AIAA_PROB_TOOL) {
    toolMenu = (
      <ConnectedAIAAMenu
        studies={toolData.studies}
        viewports={toolData.viewports}
        activeIndex={toolData.activeIndex}
        firstImageId={toolData.firstImageId}
        segmentsData={toolData.segmentsData}
        onNewSegment={toolData.onNewSegment}
      />
    );
  } else if (activeTool === MONAI_TOOL_NAMES.MONAI_PROB_TOOL) {
    toolMenu = (
      <MONAIMenu
        studies={toolData.studies}
        viewports={toolData.viewports}
        activeIndex={toolData.activeIndex}
        firstImageId={toolData.firstImageId}
        segmentsData={toolData.segmentsData}
        onNewOrUpdateSegments={toolData.onNewOrUpdateSegments}
      />
    );
  }

  return <>{toolMenu}</>;
};

SegmentationToolMenu.propTypes = {
  activeTool: PropTypes.string.isRequired,
  toolData: PropTypes.object.isRequired,
};

export default SegmentationToolMenu;
