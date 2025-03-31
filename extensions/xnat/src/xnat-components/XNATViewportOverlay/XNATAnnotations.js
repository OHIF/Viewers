import React, { useState } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import { XNAT_TOOL_NAMES } from '../../index';

import './XNATAnnotations.styl';

const {
  setToolActiveForElement,
  setToolPassiveForElement,
  setToolEnabledForElement,
  setToolDisabledForElement,
  setInactiveCursor,
} = csTools;

const onToggle = (
  evt,
  enabledElement,
  prevShowAnnotations,
  setShowAnnotations
) => {
  // Remove keyboard focus
  evt.currentTarget.blur();

  const showAnnotations = !prevShowAnnotations;
  enabledElement.viewport.showAnnotations = showAnnotations;

  const element = enabledElement.element;
  const currentToolName = window.store.getState().activeTool;
  if (showAnnotations) {
    // Set measurement tools to passive state
    XNAT_TOOL_NAMES.MEASUREMENT_TOOL_NAMES.forEach(toolName =>
      setToolPassiveForElement(element, toolName)
    );
    // Set contour & mask tools to enabled state
    XNAT_TOOL_NAMES.ROI_TOOL_NAMES.forEach(toolName => {
      // Exclude 'FreehandRoi3DSculptorTool' because it has
      // activeOrDisabledBinaryTool mixin
      if (toolName === 'FreehandRoi3DSculptorTool') {
        return;
      }
      setToolEnabledForElement(element, toolName);
    });
    // Set tool as active if it is the current global tool
    if (XNAT_TOOL_NAMES.ALL_ANNOTAION_TOOL_NAMES.includes(currentToolName)) {
      setToolActiveForElement(element, currentToolName, {
        mouseButtonMask: 1,
      });
    }
  } else {
    // Deactivate all annotation tools for element
    XNAT_TOOL_NAMES.ALL_ANNOTAION_TOOL_NAMES.forEach(toolName => {
      setToolDisabledForElement(element, toolName);
    });
    if (XNAT_TOOL_NAMES.ALL_ANNOTAION_TOOL_NAMES.includes(currentToolName)) {
      setInactiveCursor(element);
    }
  }

  cornerstone.updateImage(enabledElement.element);

  setShowAnnotations(showAnnotations);
};

const XNATAnnotations = props => {
  const { viewportIndex } = props;
  const enabledElement = cornerstone.getEnabledElements()[viewportIndex];
  const { viewport } = enabledElement;

  const [showAnnotations, setShowAnnotations] = useState(
    viewport.hasOwnProperty('showAnnotations') ? viewport.showAnnotations : true
  );

  return (
    <div className="AnnotationContainer">
      <label className="AnnotationLabel">Annotations</label>
      <label className="AnnotationSwitch">
        <input
          className="AnnotationInput"
          type="checkbox"
          tabIndex="-1"
          checked={showAnnotations}
          onChange={evt =>
            onToggle(evt, enabledElement, showAnnotations, setShowAnnotations)
          }
        />
        <span className="AnnotationSlider" />
      </label>
    </div>
  );
};

XNATAnnotations.propTypes = {
  viewportIndex: PropTypes.number.isRequired,
};

export default XNATAnnotations;
