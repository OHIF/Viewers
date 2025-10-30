import { CustomDropdownMenuContent } from './CustomDropdownMenuContent';
import { CustomSegmentStatisticsHeader } from './CustomSegmentStatisticsHeader';
import SegmentationToolConfig from '../components/SegmentationToolConfig';
import React from 'react';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import * as cornerstoneTools from '@cornerstonejs/tools';

export default function getSegmentationPanelCustomization({ commandsManager, servicesManager }) {
  return {
    'panelSegmentation.customDropdownMenuContent': CustomDropdownMenuContent,
    'panelSegmentation.customSegmentStatisticsHeader': CustomSegmentStatisticsHeader,
    'panelSegmentation.disableEditing': false,
    'panelSegmentation.showAddSegment': true,
    'panelSegmentation.onSegmentationAdd': async ({
      segmentationRepresentationType = SegmentationRepresentations.Labelmap,
    }) => {
      const { viewportGridService } = servicesManager.services;
      const viewportId = viewportGridService.getState().activeViewportId;
      if (segmentationRepresentationType === SegmentationRepresentations.Labelmap) {
        commandsManager.run('createLabelmapForViewport', { viewportId });
      } else if (segmentationRepresentationType === SegmentationRepresentations.Contour) {
        const segmentationId = await commandsManager.run('createContourForViewport', {
          viewportId,
        });
        cornerstoneTools.segmentation.config.style.setStyle(
          { segmentationId, type: SegmentationRepresentations.Contour },
          {
            fillAlpha: 0.5,
            renderFill: true,
          }
        );
      }
    },
    'panelSegmentation.tableMode': 'collapsed',
    'panelSegmentation.readableText': {
      // the values will appear in this order
      min: 'Min Value',
      minLPS: 'Min Coord',
      max: 'Max Value',
      maxLPS: 'Max Coord',
      mean: 'Mean Value',
      stdDev: 'Standard Deviation',
      count: 'Voxel Count',
      median: 'Median',
      skewness: 'Skewness',
      kurtosis: 'Kurtosis',
      peakValue: 'Peak Value',
      peakLPS: 'Peak Coord',
      volume: 'Volume',
      lesionGlycolysis: 'Lesion Glycolysis',
      center: 'Center',
    },
    'labelMapSegmentationToolbox.config': () => {
      return <SegmentationToolConfig />;
    },
    'contourSegmentationToolbox.config': () => {
      return <SegmentationToolConfig />;
    },
  };
}
