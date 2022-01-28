import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF, { DicomMetadataStore, utils } from '@ohif/core';
import {
  Notification,
  ViewportActionBar,
  useViewportGrid,
  useViewportDialog,
} from '@ohif/ui';
import { adapters } from 'dcmjs';
import id from '../id';


function OHIFCornerstoneVideoViewport({
  children,
  dataSource,
  displaySet,
  viewportIndex,
  servicesManager,
  extensionManager,
}) {
  const {
    DisplaySetService,
    MeasurementService,
    ToolBarService,
  } = servicesManager.services;
  console.log('displaySet=', displaySet);
  const { videoUrl } = displaySet;
  const mimeType = "video/mp4";

  return (
    <div className="bg-primary-dark w-full h-full">
      <video
        controls
        controlsList="nodownload"
        preload="auto"
        className="w-full h-full"
      >
        <source src={videoUrl} type={mimeType} />
        <source src={videoUrl} type={mimeType} />
        Video src/type not supported: <a href={videoUrl}>{videoUrl} of type {mimeType}</a>
      </video>
    </div>
  )
}

export default OHIFCornerstoneVideoViewport;
